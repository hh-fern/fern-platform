export function fernReplace(
  markdownContent: string,
  replacementArgs: Map<string, string>
): string {
  // Regular expression to match div tags with fern-replace attributes
  const divRegex = /<div fern-replace="([^"]+)">([\s\S]*?)<\/div>/g;

  return markdownContent.replace(divRegex, (match, attributes, content) => {
    // Parse the attributes string (e.g., "version:46.0.0,name:John,age:42")
    const attributePairs = attributes.split(",").map((pair: string) => {
      const parts = pair.split(":");
      const key = parts[0]?.trim() || "";
      const value = parts[1]?.trim() || "";
      return { key, value };
    });

    // Create a map of attributes to their original values
    const originalValues = new Map<string, string>();
    attributePairs.forEach(({ key, value }: { key: string; value: string }) => {
      originalValues.set(key, value);
    });

    // Replace values in the content based on replacementArgs
    let modifiedContent = content;
    replacementArgs.forEach((newValue, key) => {
      const originalValue = originalValues.get(key);
      if (originalValue) {
        // Replace all occurrences of the original value with the new value
        const regex = new RegExp(
          originalValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "g"
        );
        modifiedContent = modifiedContent.replace(regex, newValue);
      }
    });

    // Rebuild the div tag with updated attributes
    const updatedAttributes = attributePairs
      .map(({ key, value }: { key: string; value: string }) => {
        const newValue = replacementArgs.get(key);
        return newValue ? `${key}:${newValue}` : `${key}:${value}`;
      })
      .join(",");

    return `<div fern-replace="${updatedAttributes}">${modifiedContent}</div>`;
  });
}
