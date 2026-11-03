// const { parseStringPromise, Builder } = require('xml2js');



// request body replacer.
export const transform = async(data, config) =>{
  try {
    const {payload, replacer} = config;

    Object.entries(replacer).forEach(([key, path]: any) => {
      const [cleanPath, defaultValue] = path.split('||').map(p => p.trim());
      const resolvedValue = cleanPath
          .replace(/^data\./, '') // Remove 'data.' prefix if present
          .split('.')
          .reduce((obj, prop) => obj?.[prop], data);

      payload[key] = resolvedValue !== undefined ? resolvedValue : (defaultValue ?? payload[key]);
    });

    return {
      code: 200,
      data:payload
    }
  }
  catch (e) {
    return {
      code: 400,
      message: e.message,
    }
  }
}

exports.replacer = async (text, data) => {
  return text.replacer(data.replace, data.value);

}

export const replacePlaceholder = (
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


  return {
    code: 200,
    data: replacedTopic
  } ;
};
