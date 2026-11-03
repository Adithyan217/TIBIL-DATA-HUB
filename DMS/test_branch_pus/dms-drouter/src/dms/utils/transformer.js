const { parseStringPromise, Builder } = require('xml2js');



// request body replacer.
exports.transform = async(data, config) =>{
  const { payload, replacer } = config;
  Object.entries(replacer).forEach(([key, path]) => {
    const [cleanPath, defaultValue] = path.split('||').map(p => p.trim());
    const resolvedValue = cleanPath
        .replace(/^body\./, '')
        .split('.')
        .reduce((obj, prop) => obj?.[prop], data);

    payload[key] = resolvedValue !== undefined ? resolvedValue : defaultValue ?? payload[key];
  });
  return payload;

}
exports.replacer = async (text, data) => {
  return text.replace(data.replacer, data.value);

}

exports.replacePlaceholder = (
  topic,
  placeholderKey,
  actualValue
) => {
  // Check if the placeholder exists in the topic
  if (!topic.includes(`${placeholderKey}`)) {
    console.warn(`⚠️ Placeholder {${placeholderKey}} not found in topic.`);
    return topic; // Return the original topic if the placeholder is not found
  }

  // Replace the placeholder with the actual value
  const replacedTopic = topic.replace(`${placeholderKey}`, actualValue);
  console.log(`✅ Replaced Topic: ${replacedTopic}`);
  return replacedTopic;
};
