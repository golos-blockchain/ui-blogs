
export function parseNFTImage(json_metadata) {
    if (json_metadata) {
        const meta = JSON.parse(json_metadata)
        if (meta) return meta.image
    }
    return null
}

export function NFTImageStub() {
	return require('app/assets/images/nft.png')
}
