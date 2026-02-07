import cloudinary from './src/lib/cloudinary';

async function testCloudinaryUsage() {
    try {
        const usage = await cloudinary.api.usage();
        console.log('Cloudinary Usage Raw Response:');
        console.log(JSON.stringify(usage, null, 2));
    } catch (error) {
        console.error('Error fetching Cloudinary usage:', error);
    }
}

testCloudinaryUsage();
