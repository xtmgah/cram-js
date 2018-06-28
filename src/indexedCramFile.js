const { CramUnimplementedError } = require('./errors')

const CramFile = require('./cramFile')

class IndexedCramFile {
  constructor(args) {
    // { cram, index, seqFetch /* fasta, fastaIndex */ }) {
    if (args.cram) this.cram = args.cram
    else
      this.cram = new CramFile({
        url: args.cramUrl,
        path: args.cramPath,
        filehandle: args.cramFilehandle,
      })

    if (!(this.cram instanceof CramFile))
      throw new Error('invalid arguments: no cramfile')

    this.index = args.index
    if (!this.index.getEntriesForRange)
      throw new Error('invalid arguments: not an index')
  }

  async getFeaturesForRange(seq, start, end) {
    if (typeof seq === 'string')
      // TODO: support string reference sequence names somehow
      throw new CramUnimplementedError(
        'string sequence names not yet supported',
      )
    const seqId = seq
    const slices = await this.index.getEntriesForRange(seqId, start, end)

    // TODO: do we need to merge or de-duplicate the blocks?

    // fetch all the slices and parse the feature data
    const features = []
    const sliceResults = await Promise.all(
      slices.map(slice => this.getFeaturesInSlice(slice)),
    )
    for (let i = 0; i < sliceResults.length; i += 1) {
      const blockFeatures = sliceResults[i]
      blockFeatures.forEach(feature => {
        if (
          feature.sequenceId === seq &&
          feature.alignmentStart < end &&
          feature.alignmentStart + feature.readLength > start
        )
          features.push(feature)
      })
    }
    return features
  }

  getFeaturesInSlice({ containerStart, sliceStart, sliceBytes }) {
    const container = this.cram.getContainerAtPosition(containerStart)
    const slice = container.getSlice(sliceStart, sliceBytes)
    return slice.getAllFeatures()
  }
}

module.exports = IndexedCramFile
