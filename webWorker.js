importScripts('./singleChannelBinarize.js')
// importScripts('./rgbChannelBinarize.js')

// class EventEmitter { // used for communication inside worker    
//     constructor() {
//         this.events = {};
//     }

//     on(event, listener) {
//         if (!this.events[event]) this.events[event] = [];
//         this.events[event].push(listener);
//     }

//     emit(event, data) {
//         if (this.events[event]) {
//             this.events[event].forEach((listener) => listener(data));
//         }
//     }
// }

self.onmessage = async function (e) {
    let data = {};
    switch (e.data.type) {       
        case "task":          
            const { imageData, parentId, taskId } = e.data.payload;
            try {
                // const result = await rgbChannelBinarize(imageData, (progress) => {
                //     self.postMessage({
                //         type: "progress",
                //         taskId: taskId,
                //         parentId: parentId,
                //         progress,
                //     });
                // });
                const result = await singleChannelBinarize(imageData, (progress) => {                    
                    self.postMessage({
                        type: "progress",
                        taskId: taskId,
                        parentId: parentId,
                        progress,
                    });
                });                
                self.postMessage({
                    type: "taskCompleted",
                    taskId: taskId,
                    payload: {
                        parentId: parentId,
                        processedImage: result
                    }
                });
            } catch (error) {
                self.postMessage({
                    type: "error",
                    taskId: taskId,
                    parentId: parentId,
                    payload: { error: error.message },
                });
            }
            break;

        default:
            console.warn("[Web Worker]: Unknown message type:", type);
    }
};
