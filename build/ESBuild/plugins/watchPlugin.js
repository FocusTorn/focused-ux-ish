// const ansii = { //> coloration codes
//     resetStyle: '\x1b[0m',
//     bold: '\x1b[1m',

//     base: '\x1b[38;5;250m',
//     blue: '\x1b[38;5;39m',
//     blueLight: '\x1b[38;5;153m',
//     cyan: '\x1b[38;5;159m',
//     gold: '\x1b[38;5;214m',
//     green: '\x1b[38;5;35m',
//     greenBright: '\x1b[38;5;76m',
//     purple: '\x1b[38;5;171m',
//     red: '\x1b[38;5;9m',
//     white: '\x1b[38;5;15m',
//     yellow: '\x1b[38;5;226m',
// };

// //<

// function getCurrentTimeWithMilliseconds() { //>
//     const now = new Date();
//     const hours = now.getHours().toString().padStart(2, '0');
//     const minutes = now.getMinutes().toString().padStart(2, '0');
//     const seconds = now.getSeconds().toString().padStart(2, '0');
//     // const milliseconds = now.getMilliseconds().toString().padStart(3, '0');

//     // return `${hours}:${minutes}:${seconds}.${milliseconds}`;
//     return `${hours}:${minutes}:${seconds}`;
// }

// //<

// const watchPlugin = {
//     name: 'watchPlugin',
//     setup(build) {
//         let count = 0;
//         // build.onEnd((_result) => {
//         build.onEnd(() => {
//             if(watch){
//                 if (count++ === 0) {
//                     const currTime = getCurrentTimeWithMilliseconds();
//                     console.log(`[${currTime}] Completed Build:`, count);
//                 } else {
//                     const currTime = getCurrentTimeWithMilliseconds();
//                     console.log(`[${currTime}] Completed Build:`, count);
//                 }
//             }
//         });
//     },
// };

// export default watchPlugin;
