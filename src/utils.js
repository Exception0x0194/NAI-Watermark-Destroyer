const bytesB64List = [
    "c3RlYWx0aF9wbmdjb21wAAAOuB+LCACyx2VmAv99U9tq20AQ/RWxzyVYtkOjvhWHlkIIpXkpVGVZ746kJXtR92LXhPx7Z3dlRwKnL5LmzJwzV72Qe/DcyTFIa8inirRR3G0EPvnH/Xvf5ENFnmwXjsxB4jzaA6jP3wocHc/gU2B7BdW97LroUbz6+VA1u936y6bZpsivYMCxlLYKUmdKXd9sb+vs3VmtwYSEvrRkdFaPoUWrJe1UyVTW/ywUaokPMPpEXd8lcwDZD1mqXq23CTlKEYY54DlTkIDbZEXDrRH0AtY3qwTzrqcOLuiqoB5ATGXm5IZ6pkcFuYA655cCqIB97ClOzSl2Sq6OKQ+ZYKUHTDaAiEUZMZzSAYqggp7xEz1sKPwNYMSC7KADB4YDlaazTufppkDHeABBdVRBjkX21+8lwwd892G4ElRacKWYZwpYmKMMSchhqtSFMwrOKgPhojQf1ptXWwEquUxUKvnEyTAtOQ0DjnOwSkjTL7q6FkBHwDMzQZ6n3zTNu7FaJuhtgedd6UUarymyl9CzHGla9B6UPVIve81my1bWMRpTU8d8VH7eVnZyhQJXnJHPj8TBn4izpOE0Thv/nu99+kPgR/FP5yx7g6scmB/OGq/k9R/4r7lsxwMAAA==",
    "c3RlYWx0aF9wbmdjb21wAAAOuB+LCADyNHFmAv99U9tq20AQ/RWxzyVYtkOjvhWHlkIIpXkpVGVZ746kJXtR92LXhPx7Z3dlRwKnL5LmzJwzV72Qe/DcyTFIa8inirRR3G0EPvnm43vf5ENFnmwXjsxB4jzaA6jP3wocHc/gU2B7BdW97LroUbz6+VA1u936y6bZpsivYMCxlLYKUmdKXd9sb+vs3VmtwYSEvrRkdFaPoUWrJe1UyVTW/ywUaokPMPpEXd8lcwDZD1mqXq23CTlKEYY54DlTkIDbZEXDrRH0AtY3qwTzrqcOLuiqoB5ATGXm5IZ6pkcFuYA655cCqIB97ClOzSl2Sq6OKQ+ZYKUHTDaAiEUZMZzSAYqggp7xEz1sKPwNYMSC7KADB4YDlaazTufppkDHeABBdVRBjkX21+8lwwd892G4ElRacKWYZwpYmKMMSchhqtSFMwrOKgPhojQf1ptXWwEquUxUKvnEyTAtOQ0DjnOwSkjTL7q6FkBHwDMzQZ6n3zTNu7FaJuhtgedd6UUarymyl9CzHGla9B6UPVIve81my1bWMRpTU8d8VH7eVnZyhQJXnJHPj8TBn4izpOE0Thv/nu99+kPgR/FP5yx7g6scmB/OGq/k9R8P4ot/xwMAAA=="
];

function base64ToBits(base64) {
    let binaryString = atob(base64);
    let bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    const bits = [];
    bytes.forEach(byte => {
        for (let i = 7; i >= 0; i--) {
            bits.push((byte >> i) & 1);
        }
    });
    return bits;
}

function getRandomBase64String(bytesB64List, probability) {
    const randomValue = Math.random();
    return randomValue < probability ? bytesB64List[0] : bytesB64List[1];
}

export async function embedStealthExif(imgSrc, probability = 0.8) {
    const selectedBase64 = getRandomBase64String(bytesB64List, probability);
    const bits = base64ToBits(selectedBase64);

    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true });
    let img = new Image();
    img.src = imgSrc;

    await img.decode();

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    let imageData = ctx.getImageData(0, 0, img.width, img.height);

    // Get bits here...
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
    return canvas.toDataURL();
}
