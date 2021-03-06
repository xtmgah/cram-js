const Constants = require('./constants')

const baseNumbers = {
  a: 0,
  A: 0,
  c: 1,
  C: 1,
  g: 2,
  G: 2,
  t: 3,
  T: 3,
  n: 4,
  N: 4,
}

function decodeBaseSubstitution(
  cramRecord,
  refRegion,
  compressionScheme,
  readFeature,
) {
  if (!refRegion) return

  // decode base substitution code using the substitution matrix
  const refCoord = readFeature.refPos - refRegion.start
  const refBase = refRegion.seq.charAt(refCoord)
  if (refBase) readFeature.ref = refBase
  let baseNumber = baseNumbers[refBase]
  if (baseNumber === undefined) baseNumber = 4
  const substitutionScheme = compressionScheme.substitutionMatrix[baseNumber]
  const base = substitutionScheme[readFeature.data]
  if (base) readFeature.sub = base
}

/**
 * Class of each CRAM record returned by this API.
 */
class CramRecord {
  constructor() {
    this.tags = {}
  }

  /**
   * @returns {boolean} true if the read is paired, regardless of whether both segments are mapped
   */
  isPaired() {
    return !!(this.flags & Constants.BAM_FPAIRED)
  }

  /** @returns {boolean} true if the read is paired, and both segments are mapped */
  isProperlyPaired() {
    return !!(this.flags & Constants.BAM_FPROPER_PAIR)
  }

  /** @returns {boolean} true if the read itself is unmapped; conflictive with isProperlyPaired */
  isSegmentUnmapped() {
    return !!(this.flags & Constants.BAM_FUNMAP)
  }

  /** @returns {boolean} true if the read itself is unmapped; conflictive with isProperlyPaired */
  isMateUnmapped() {
    return !!(this.flags & Constants.BAM_FMUNMAP)
  }

  /** @returns {boolean} true if the read is mapped to the reverse strand */
  isReverseComplemented() {
    return !!(this.flags & Constants.BAM_FREVERSE)
  }

  /** @returns {boolean} true if the mate is mapped to the reverse strand */
  isMateReverseComplemented() {
    return !!(this.flags & Constants.BAM_FMREVERSE)
  }

  /** @returns {boolean} true if this is read number 1 in a pair */
  isRead1() {
    return !!(this.flags & Constants.BAM_FREAD1)
  }

  /** @returns {boolean} true if this is read number 2 in a pair */
  isRead2() {
    return !!(this.flags & Constants.BAM_FREAD2)
  }

  /** @returns {boolean} true if this is a secondary alignment */
  isSecondary() {
    return !!(this.flags & Constants.BAM_FSECONDARY)
  }

  /** @returns {boolean} true if this read has failed QC checks */
  isFailedQc() {
    return !!(this.flags & Constants.BAM_FQCFAIL)
  }

  /** @returns {boolean} true if the read is an optical or PCR duplicate */
  isDuplicate() {
    return !!(this.flags & Constants.BAM_FDUP)
  }

  /** @returns {boolean} true if this is a supplementary alignment */
  isSupplementary() {
    return !!(this.flags & Constants.BAM_FSUPPLEMENTARY)
  }

  /**
   * @returns {boolean} true if the read is detached
   */
  isDetached() {
    return !!(this.cramFlags & Constants.CRAM_FLAG_DETACHED)
  }

  /** @returns {boolean} true if the read has a mate in this same CRAM segment */
  hasMateDownStream() {
    return !!(this.cramFlags & Constants.CRAM_FLAG_MATE_DOWNSTREAM)
  }

  /** @returns {boolean} true if the read contains qual scores */
  isPreservingQualityScores() {
    return !!(this.cramFlags & Constants.CRAM_FLAG_PRESERVE_QUAL_SCORES)
  }

  /** @returns {boolean} true if the read has no sequence bases */
  isUnknownBases() {
    return !!(this.cramFlags & Constants.CRAM_FLAG_NO_SEQ)
  }

  /**
   * annotates this feature with the given reference region.
   * right now, this only uses the reference sequence to decode
   * which bases are being substituted in base substitution features.
   *
   * @param {object} refRegion
   * @param {number} refRegion.start
   * @param {number} refRegion.end
   * @param {string} refRegion.seq
   * @param {CramContainerCompressionScheme} compressionScheme
   * @returns {undefined} nothing
   */
  addReferenceSequence(refRegion, compressionScheme) {
    if (this.readFeatures) {
      // decode the base substituted in a base substitution,
      // if we can fetch the reference sequence
      this.readFeatures.forEach(readFeature => {
        if (readFeature.code === 'X')
          decodeBaseSubstitution(
            this,
            refRegion,
            compressionScheme,
            readFeature,
          )
      })
    }
  }

  toJSON() {
    const data = {}
    Object.keys(this).forEach(k => {
      if (k.charAt(0) === '_') return
      data[k] = this[k]
    })

    return data
  }
}

module.exports = CramRecord
