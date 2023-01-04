export const handleFormatImages = (newImages, existingImages) => {
  const filterValidSize = [...newImages].filter(file => file.size <= 1000000)
  const nextImageSize = newImages.length !== filterValidSize.length
  const nextImageCount = (existingImages.length + filterValidSize.length) > 6
  const sliceLength = filterValidSize.slice(0, 6 - existingImages.length)
  const formattedFiles = sliceLength.map(file => ({
    file,
    key: window.crypto.getRandomValues(new Uint32Array(1))[0],
    src: URL.createObjectURL(file)
  }))
  const nextImages = [...existingImages, ...formattedFiles]
  return {
    nextImageSize,
    nextImageCount,
    nextImages
  }
}

export const handleBodyOverflow = (...conditions) => {
  const overflowStyle =
    conditions.some(Boolean)
      ? 'hidden'
      : null

  if (window.document.body.style.overflow !== overflowStyle) {
    window.document.body.style.overflow = overflowStyle
  }
}
