export function replacePlaceholder(
    topic: string, 
    placeholderKey: string, 
    actualValue: string
  ): string {
    if (!topic.includes(`{${placeholderKey}}`)) {
      console.warn(`⚠️ Placeholder {${placeholderKey}} not found in topic.`);
      return topic; // Return original topic if placeholder is not found
    }
  
    const replacedTopic = topic.replace(`{${placeholderKey}}`, actualValue);
    console.log(`✅ Replaced Topic: ${replacedTopic}`);
    return replacedTopic;
  }
  