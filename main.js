import taskManager from "./taskManager.js"

function toastNotification(message) {
    function extractNumericValue(cssValue) {
        return parseFloat(cssValue.replace(/[^\d.]/g, '')) // Remove non-numeric characters
    }
    const toastContainer = document.querySelector('.toast-container')
    const root = document.documentElement
    const fadeInDuration = extractNumericValue(
        getComputedStyle(root).getPropertyValue('--fade-in-duration')
    ) // 0.5
    const fadeOutDuration = extractNumericValue(
        getComputedStyle(root).getPropertyValue('--fade-out-duration')
    ) // 4
    const slideOutDuration = extractNumericValue(
        getComputedStyle(root).getPropertyValue('--slide-out-duration')
    ) // 0.5
    const displayOutTime =
        (fadeInDuration + fadeOutDuration + slideOutDuration) * 1000
    const toastDiv = document.createElement('div')
    toastDiv.className = 'toast'
    const template = `
  <p>${message.trim()}</p>
  <button class="close-toast">❌</button>
  `
    toastDiv.innerHTML = template
    // toastDiv.querySelector('.close-toast').addEventListener('click', e => {
    //   e.target.parentElement.style.display = 'none'
    // })
    toastDiv.addEventListener('click', e => {
        e.currentTarget.style.display = 'none'
    })
    toastContainer.appendChild(toastDiv)

    setTimeout(() => {
        toastContainer.firstElementChild.remove()
        // toastDiv.remove()
    }, displayOutTime + 10)
}

function openModal(rootElement) {
    const modal = document.querySelector('#modal')
    const src = rootElement.querySelector('img').src
    modal.innerHTML = `<div class="modal-content">
  <button class="close-modal">❌</button>
  <img class="modal-image" src="${src}" alt="Modal Image" />
  </div>`
    const handleModalClick = e => {
        let classes = e.target.classList.value
        // let currentRoot = e.currentTarget
        switch (classes) {
            case 'close-modal':
                // e.currentTarget.classList.add('hidden')
                e.currentTarget.classList.remove('open')
                e.currentTarget.innerHTML = ''
                e.currentTarget.removeEventListener('click', handleModalClick)
                break
            default:
                const modalWidth = e.currentTarget.offsetWidth
                const clickX = e.clientX

                if (clickX < modalWidth / 2) {
                    // Left side clicked
                    let prevElement = rootElement.previousElementSibling
                    if (!prevElement) return
                    e.currentTarget.querySelector('img').src =
                        prevElement.querySelector('img').src
                    rootElement = prevElement
                } else {
                    // Right side clicked
                    let nextElement = rootElement.nextElementSibling
                    if (!nextElement) return
                    e.currentTarget.querySelector('img').src =
                        nextElement.querySelector('img').src
                    rootElement = nextElement
                }
        }
    }
    // Using Event Delegation
    modal.addEventListener('click', handleModalClick)
    modal.classList.add('open')
    // modal.classList.remove('hidden')
}

function getFileDetails(file) {
    function formatDateTime(timestamp) {
        const options = {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }

        return new Intl.DateTimeFormat('en-US', options).format(
            new Date(timestamp)
        )
    }
    function formatSize(size) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB']
        let index = 0
        while (size >= 1024 && index < units.length - 1) {
            size /= 1024
            index++
        }
        return `${size.toFixed(2)} ${units[index]}`
    }

    return {
        name: file.name,
        size: formatSize(file.size), // Convert size to appropriate units
        lastModified: formatDateTime(file.lastModified) // Format the timestamp
    }
}

function showProcessedImage(rootDivId, dataURL) {    
    const cell = document.getElementById(rootDivId)
    cell.querySelector('img').src = dataURL;    
    cell.querySelector('.loading').style.display = 'none'
}

function drawImgOnCanvas(img) {
    const canvas = document.createElement('canvas')
    // use simple height & width for faster raster
    canvas.width = img.naturalWidth //naturalWidth
    canvas.height = img.naturalHeight //naturalHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas
}

function imageDataToDataUrl(imageData) {
    function formatSize(size) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB']
        let index = 0
        while (size >= 1024 && index < units.length - 1) {
            size /= 1024
            index++
        }
        return `${size.toFixed(2)} ${units[index]}`
    }
    // Create a canvas element
    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height
    const ctx = canvas.getContext('2d')

    // Put the ImageData onto the canvas
    ctx.putImageData(imageData, 0, 0)

    // Convert the canvas to a Data URL
    return canvas.toDataURL('image/png') // You can specify 'image/jpeg' if preferred
    return dataURL
}

function processImage() {
    // const rootDiv = this.parentNode
    const rootDiv = this
    const orgImg = rootDiv.querySelector('img')
    const canvas = drawImgOnCanvas(orgImg)
    const ctx = canvas.getContext('2d')
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    // send imageData to worker
    taskManager.addTask(rootDiv.id, rootDiv.id, imageData)
}

function addPreview({ name, size, lastModified }, src) {
    let cellDiv = document.createElement('article')
    cellDiv.className = 'cell'
    cellDiv.id = `_${name.toLowerCase()}-${new Date().getTime()}`.replace(/[^a-zA-Z0-9_-]/g, "_");
    cellDiv.innerHTML = `<div class="imagePreview">
        <img src="${src}">
        <span class="loading default-skeleton"></span>
      </div>
      <div class="details">
        <p class="name"><strong>${name}</strong><span class="close-cell">❌</span></p>
        <p class="size">${size}</p>
        <p class="size">${lastModified}</p>
        <p class="status"><strong>Status: </strong><span>Wating to be processed</span></p>  
      </div>`

    const cellDivClickHandler = e => {
        if (e.target.classList.contains('close-cell')) {
            // open confirmation box
            // Get the position of the clicked button
            const rect = e.target.getBoundingClientRect()
            let confirmationBoxO = document.querySelector('#confirmationBox')
            const confirmationBox = confirmationBoxO.cloneNode(true) // just to remove all event listener
            confirmationBoxO.parentElement.replaceChild(confirmationBox, confirmationBoxO)
            const boxWidth = 250 // Width of the confirmation box
            const boxHeight = 100 // Approximate height

            let top = rect.top + window.scrollY + 20 // Default position
            let left = rect.left + window.scrollX

            // Adjust if it overflows the right boundary
            if (left + boxWidth > window.innerWidth) {
                left = window.innerWidth - boxWidth - 10 // 10px margin
            }

            // Adjust if it overflows the bottom boundary
            if (top + boxHeight > window.innerHeight + window.scrollY) {
                top = rect.top + window.scrollY - boxHeight - 10 // Show above the button
            }
            // Position the confirmation box near the button
            confirmationBox.style.top = `${top}px`
            confirmationBox.style.left = `${left}px`

            let confirmationClickHandler = function (e) {
                if (e.target.classList.contains('yes')) {
                    this.removeEventListener('click', cellDivClickHandler)
                    this.classList.add('exit')
                    this.addEventListener('animationend', () => {
                        this.remove()
                    }, { once: true })
                    // this.remove()
                }
                e.currentTarget.classList.add('hidden')
                e.currentTarget.removeEventListener('click', confirmationClickHandler)
            }
            confirmationClickHandler = confirmationClickHandler.bind(e.currentTarget)
            confirmationBox.addEventListener('click', confirmationClickHandler)
            confirmationBox.classList.remove('hidden')
        } else if (e.target.closest('.imagePreview')) {
            openModal(e.currentTarget)
        }
    }
    // Using Event Delegation
    cellDiv.addEventListener('click', cellDivClickHandler)
    previewList.append(cellDiv)
    setTimeout(e => {
        processImage.call(cellDiv)
    }, 100)
}

function readFile(file) {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = function (e) {
        addPreview(getFileDetails(file), e.currentTarget.result)
    }
    reader.readAsDataURL(file)
}

taskManager.on("updateUI", (e) => {
    switch (e.type) {
        case "progress":
            // {
            //     type: "progress",
            //     taskId: taskId,
            //     parentId: parentId,
            //     progress,
            // }
            // console.log("progress: ", e.progress.message);
            document.querySelector(`#${e.parentId} .status>span`).innerText = e.progress.message;
            break;

        case "taskCompleted":
            const { parentId, processedImage } = e.payload
            showProcessedImage(parentId, imageDataToDataUrl(processedImage))            
            // document.querySelector(`#${e.parentId} .loading`).style.display = 'none'
            break;

        case "error":
            console.error("error", e);
            break;

        case "batchCompleted":
            console.log("bat", e);
            break;

        case "taskAssigned":
            toastNotification(e.toastMessage)
            break;

        default:
            console.warn("Unknown message type:", e);
    }
})
console.log(taskManager)
if (typeof Worker !== 'undefined') {
    toastNotification('Web Worker: Supported')
} else {
    toastNotification('Web Worker: Not Supported')
}

const fileInput = document.getElementById('fileInput')
const uploadButton = document.getElementById('uploadButton')
const previewList = document.getElementById('previewList')
uploadButton.addEventListener('click', () => fileInput.click())
fileInput.addEventListener("change", event => {
    const files = [...event.target.files]
    if (!files.length) return
    files.map(readFile)
})