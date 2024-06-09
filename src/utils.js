import pako from 'pako';

class DataWriter {
    constructor() {
        this.data = [];
    }

    writeBit(bit) {
        this.data.push(bit);
    }

    writeNBits(bits) {
        for (let bit of bits) {
            this.writeBit(bit);
        }
    }

    writeByte(byte) {
        for (let i = 7; i >= 0; i--) {
            this.writeBit((byte >> i) & 1);
        }
    }

    writeNBytes(bytes) {
        for (let byte of bytes) {
            this.writeByte(byte);
        }
    }

    writeInt32(value) {
        let buffer = new ArrayBuffer(4);
        let view = new DataView(buffer);
        view.setInt32(0, value, false);
        for (let i = 0; i < 4; i++) {
            this.writeByte(view.getUint8(i));
        }
    }

    getData() {
        return this.data;
    }
}

export async function embedStealthExif(imgSrc, text) {
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true });
    let img = new Image();
    img.src = imgSrc;

    await img.decode();

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    let imageData = ctx.getImageData(0, 0, img.width, img.height);
    let dataWriter = new DataWriter();

    const magic = "stealth_pngcomp";
    dataWriter.writeNBytes(magic.split('').map(c => c.charCodeAt(0)));

    const compressedText = pako.gzip(text);
    dataWriter.writeInt32(compressedText.length * 8); // data length in bits
    dataWriter.writeNBytes(new Uint8Array(compressedText));

    let bits = dataWriter.getData();
    let bitIndex = 0;

    for (let x = 0; x < img.width; x++) {
        for (let y = 0; y < img.height; y++) {
            let index = (y * img.width + x) * 4;
            if (bitIndex < bits.length) {
                imageData.data[index + 3] = (imageData.data[index + 3] & 0xFE) | bits[bitIndex];
                bitIndex++;
            } else {
                break;
            }
        }
        if (bitIndex >= bits.length) {
            break;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL(); // 返回嵌入水印后的图片数据URL
}