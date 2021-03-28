function fitToPreview(goodWidth, goodHeight, width, height) {
    let previewWidth;
    let previewHeight;

    let overWidth = width / goodWidth;
    let overHeight = height / goodHeight

    if (overWidth <= 1 && overHeight <= 1) {
        previewWidth = width;
        previewHeight = height;
        return { previewWidth, previewHeight };
    }

    let proportion = width / height;

    if (overWidth > overHeight) {
        previewWidth = goodWidth;
        previewHeight = Math.round(previewWidth / proportion);
    } else {
        previewHeight = goodHeight;
        previewWidth = Math.round(previewHeight * proportion);
    }
    return { previewWidth, previewHeight };
}

module.exports = {
    fitToPreview
}
