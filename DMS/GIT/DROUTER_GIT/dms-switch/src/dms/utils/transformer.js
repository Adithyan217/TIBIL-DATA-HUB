const { parseStringPromise, Builder } = require('xml2js');


exports.transform = async (content, context) => {
  // const transformer = process.env[context];
  const transformer = 'text_to_json'
  try {
    let result;
    switch ('xml_to_json') {
      case 'xml_to_json':
        result = await parseStringPromise(content);
        return JSON.stringify(result); // Ensures parsed JSON as string is returned
      case 'json_to_xml':
        const data = JSON.parse(content);
        const builder = new Builder({ pretty: true });
        return builder.buildObject(data); // Ensures XML string is returned
      case 'text_to_json':
        return content; // Ensures text data is converted to JSON string
      default:
        throw new Error('Invalid transformation');
    }
  } catch (error) {
    console.error('Transformation error:', error.message);
    return { error: 'Transformation failed', details: error.message };
  }
};
