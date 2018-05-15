const Mode = require('./Mode')
const fs = require('fs')
const youtubedl = require('youtube-dl')
const ffmpeg = require('fluent-ffmpeg')
const { exec } = require('child_process')
const config = require('../config/config.js')
const leds = require('rpi-ws281x-native')
const chalk = require('chalk')

function rgbToInt(r, g, b) {
    return r << 16 | g  << 8 | b
}

module.exports = class YoutubeMode extends Mode {
    constructor({ url }) {
        super()
        console.log('Initializing YoutubeMode')

        console.log('Loading url', url)
        let video = youtubedl(url, ['--format=18'], { cwd: __dirname })
        video.on('info', function (info) {
            console.log('Download started')
            console.log('filename: ' + info.filename)
            console.log('size: ' + info.size)
        })
        video.pipe(fs.createWriteStream('myvideo.mp4'))
        video.on('end', function () {
            console.log('finished downloading!')
            let ff = ffmpeg(__dirname + '/../myvideo.mp4').noAudio().outputFormat('rawvideo')
            console.log('file loaded')
            console.log('Led Count = ' + config.ledCount)
            const ffmpegCommand = 'yes | ffmpeg -i myvideo.mp4 -filter:v "scale=1650:-1, crop=w=in_w:h=1:x=0:y=in_h/2:exact=1" -vcodec rawvideo -pix_fmt rgb24 out.rgb'
            exec(ffmpegCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
                console.log('ffmpeg command finished')
                // let file = fs.readFileSync(__dirname + '/../out.rgb')
                // let fileArray = new Uint32Array(file)
                // console.log(fileArray.length + '  <------- length')
                let frameNb = 0
                setInterval(() => {
                    let readStream = fs.createReadStream(__dirname + '/../out.rgb', {start: frameNb * 1650, end: (3 + frameNb) * 1650 - 1})
                    let data = ''
                    let testChunk
                    readStream.on('data', function(chunk) {  
                        console.log('chunk loaded')
                        testChunk = new Uint32Array(chunk)
                        console.log(testChunk.length)
                        
                        // console.log(testChunk)
                        // data += chunk
                    }).on('end', function() {
                        console.log('stream read ended')
                        let frame = 0;
                        let newArray = new Uint32Array(1650).map((val, index, array) => {
                            let r = testChunk[index * 3]
                            let g = testChunk[index * 3 + 1]
                            let b = testChunk[index * 3 + 2]
                            // console.log(chalk.rgb(r, g, b)(index))
                            // if( r === 189 && g === 189 && b === 189) console.log(index)
                            if (index === 1649) console.log(chalk.rgb(r, g, b)(index))
                            if (index === 1650) console.log(`${r} ${g} ${b}`)
                            if (index === 1651) console.log(`${r} ${g} ${b}`)
                            // if (index === 1651) console.log(chalk.rgb(r, g, b)(index))
                            // console.log(`${r} ${g} ${b}`)
                            return rgbToInt(r, g, b)
                        })
                        console.log('Rendering Frame ' + frameNb)
                        
                        leds.render(newArray)
                        frameNb = frameNb +1
                        // let p = newArray[newArray.length - 2]
                        // console.log(chalk.rgb(p.r, p.g, p.b)('youpi'))
                        // console.log('maimmamidaimi')
                    })
                }, 40)
              })
            // ffmpeg -i myVideo.mp4 -vcodec rawvideo -filter:v "crop=in_w/:1:0:0" -pix_fmt yuv420p out.rgb
            // ffmpeg -i myVideo.mp4 filter:v "crop=in_w/:1:0:0" out.mp4
            // ffmpeg -i myVideo.mp4 -filter:v "crop=in_w:1:0:0" out.mp4
            // ffmpeg -i myVideo.mp4 -filter:v "crop=w=in_w:h=1:x=0:y=0:exact=1" -vcodec rawvideo out.rgb
            // ffmpeg -i myVideo.mp4 -filter:v "crop=w=in_w:h=1:x=0:y=0:exact=1" -vcodec rawvideo -pix_fmt rgb24 out.rgb
            // ffmpeg -i myVideo.mp4 -filter:v "crop=w=in_w:h=1:x=0:y=0:exact=1" -vcodec rawvideo -pix_fmt rgb32 out.rgb
            // ffmpeg -i myvideo.mp4 -filter:v scale=1650:-1 -filter:v "crop=w=in_w:h=1:x=0:y=0:exact=1" -vcodec rawvideo -pix_fmt rgb32 out.rgb
            // fmpeg -i myvideo.mp4 -filter:v "scale=1650:-1" -filter:v "crop=w=in_w:h=2:x=0:y=0:exact=1" -vcodec rawvideo -pix_fmt rgb24 out.rgb
            // yes | fmpeg -i myvideo.mp4 -filter:v "scale=1650:-1" -filter:v "crop=w=in_w:h=1:x=0:y=0:exact=1" -vcodec rawvideo -pix_fmt rgb24 out.rgb
                // .complexFilter([
                //     // Duplicate video stream 3 times into streams a, b, and c
                //     { filter: 'split', options: '3', outputs: ['a', 'b', 'c'] },

                //     // Create stream 'red' by cancelling green and blue channels from stream 'a'
                //     { filter: 'lutrgb', options: { g: 0, b: 0 }, inputs: 'a', outputs: 'red' },

                //     // Create stream 'green' by cancelling red and blue channels from stream 'b'
                //     { filter: 'lutrgb', options: { r: 0, b: 0 }, inputs: 'b', outputs: 'green' },

                //     // Create stream 'blue' by cancelling red and green channels from stream 'c'
                //     { filter: 'lutrgb', options: { r: 0, g: 0 }, inputs: 'c', outputs: 'blue' },

                //     // Pad stream 'red' to 3x width, keeping the video on the left, and name output 'padded'
                //     { filter: 'pad', options: { w: 'iw3', h: 'ih' }, inputs: 'red', outputs: 'padded' },

                //     // Overlay 'green' onto 'padded', moving it to the center, and name output 'redgreen'
                //     { filter: 'overlay', options: { x: 'w', y: 0 }, inputs: ['padded', 'green'], outputs: 'redgreen' },

                //     // Overlay 'blue' onto 'redgreen', moving it to the right
                //     { filter: 'overlay', options: { x: '2w', y: 0 }, inputs: ['redgreen', 'blue'] },
                // ])
        })
    }
}