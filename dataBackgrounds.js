const backgrounds = [
    {
        name: 'Default',
        image: 'images/background.gif'
    },
    {
        name: 'Alberta',
        image: 'https://photos.smugmug.com/photos/i-CK9r8kB/1/X3/i-CK9r8kB-X3.jpg'
    },
    {
        name: 'Arizona',
        image: 'https://photos.smugmug.com/photos/i-BNT9VRh/0/X3/i-BNT9VRh-X3.jpg'
    },
    {
        name: 'Iceland',
        image: 'https://photos.smugmug.com/photos/i-2p74H4K/3/X3/i-2p74H4K-X3.jpg'
    },
    {
        name: 'Montana',
        image: 'https://photos.smugmug.com/photos/i-zmpbXTh/0/X3/i-zmpbXTh-X3.jpg'
    },
    {
        name: 'Space',
        image: 'https://photos.smugmug.com/photos/i-ZxLZzWD/0/X3/i-ZxLZzWD-X3.jpg'
    },
    {
        name: 'Sunset',
        image: 'https://photos.smugmug.com/photos/i-qHGHNjq/0/X3/i-qHGHNjq-X3.jpg'
    }
];

const bgMap = new Map();

for (var i = 0; i < backgrounds.length; i++) {
    bgMap.set(backgrounds[i].name, backgrounds[i].image);
}