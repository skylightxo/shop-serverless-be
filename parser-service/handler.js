const {
  csvParse,
  getReadStreamsFromRecords,
  bulkUpload,
  bulkDelete
} = require('./methods')

module.exports.parser = async (event) => {
  const streams = await getReadStreamsFromRecords(event.Records)

  const parsedCsvs = await Promise.all(streams.map(stream => csvParse(stream)))
  const jsons = await bulkUpload(parsedCsvs)
  await bulkDelete(event.Records)

  return {
    statusCode: 200,
    jsons
  };
};
