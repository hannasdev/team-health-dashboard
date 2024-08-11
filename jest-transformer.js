export default {
  process(sourceText, sourcePath, options) {
    return {
      code: sourceText.replace(/\.js/g, ''),
    };
  },
};
