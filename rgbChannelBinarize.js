function extractChannels(imageData) {
    const { data, width, height } = imageData
    const totalPixels = width * height

    const redChannel = new Uint8Array(totalPixels)
    const greenChannel = new Uint8Array(totalPixels)
    const blueChannel = new Uint8Array(totalPixels)

    for (let i = 0; i < totalPixels; i++) {
        redChannel[i] = data[i * 4] // Red
        greenChannel[i] = data[i * 4 + 1] // Green
        blueChannel[i] = data[i * 4 + 2] // Blue       
    }

    return {
        redChannel,
        greenChannel,
        blueChannel,
        width,
        height
    }
}

function calculateHistogram(channel) {
    const histogram = new Array(256).fill(0)
    channel.forEach(value => {
        histogram[value]++
    })
    return histogram
}

function otsuThreshold(histogram, totalPixels) {
    let sum = histogram.reduce((sum, val, i) => sum + i * val, 0)
    let sumB = 0
    let wB = 0
    let wF = 0
    let maxVariance = 0
    let threshold = 0

    for (let t = 0; t < 256; t++) {
        wB += histogram[t]
        if (wB === 0) continue

        wF = totalPixels - wB
        if (wF === 0) break

        sumB += t * histogram[t]
        const mB = sumB / wB
        const mF = (sum - sumB) / wF

        const variance = wB * wF * (mB - mF) ** 2

        if (variance > maxVariance) {
            maxVariance = variance
            threshold = t
        }
    }

    return threshold
}

function applyThreshold(channel, threshold) {
    return channel.map(value => (value > threshold ? 255 : 0))
}

function combineChannels( width, height, thresholdsRGB) {
    const output = new Uint8ClampedArray(width * height * 4)
    const {thresholdedRed, thresholdedGreen, thresholdedBlue} = thresholdsRGB

    for (let i = 0; i < width * height; i++) {
        //   const value = thresholdedRed[i] & thresholdedGreen[i] & thresholdedBlue[i]
        let value =
            thresholdedRed[i] + thresholdedGreen[i] + thresholdedBlue[i]
        value = value >= 510 ? 255 : 20 // like a voting system 510 = 255*2
        output[i * 4] = value // Red
        output[i * 4 + 1] = value // Green
        output[i * 4 + 2] = value // Blue
        output[i * 4 + 3] = 255 // Alpha
        // playing
        //   output[i * 4] = thresholdedRed[i] // Red
        //   output[i * 4 + 1] = thresholdedGreen[i] // Green
        //   output[i * 4 + 2] = thresholdedBlue[i] // Blue
        //   output[i * 4 + 3] = 255 // Alpha
    }
    return new ImageData(output, width, height)
}

async function rgbChannelBinarize(imageData, progressTracker) {   
    const {
        redChannel,
        greenChannel,
        blueChannel,
        width,
        height
    } = extractChannels(imageData)

    progressTracker({message: 'Calculating rgb channel histogram'})
    const redHistogram = calculateHistogram(redChannel)
    const greenHistogram = calculateHistogram(greenChannel)
    const blueHistogram = calculateHistogram(blueChannel)

    const totalPixels = width * height

    progressTracker({message: 'Calculating rgb channel threshold'})
    const redThreshold = otsuThreshold(redHistogram, totalPixels)
    const greenThreshold = otsuThreshold(greenHistogram, totalPixels)
    const blueThreshold = otsuThreshold(blueHistogram, totalPixels)

    progressTracker({message: 'Applying rgb channel threshold'})
    const thresholdedRed = applyThreshold(redChannel, redThreshold)
    const thresholdedGreen = applyThreshold(greenChannel, greenThreshold)
    const thresholdedBlue = applyThreshold(blueChannel, blueThreshold)

    progressTracker({message: 'Processing done'})
    return combineChannels(width, height, {
        thresholdedRed: thresholdedRed,
        thresholdedGreen: thresholdedGreen,
        thresholdedBlue: thresholdedBlue
    })
}