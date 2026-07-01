import itemData from '../../public/items/itemData.json'

export default function handler(req, res) {
    res.status(200).json(itemData)
}
