import itemData from '../../public/items/items.json'

export default function handler(req, res) {
    res.status(200).json(itemData)
}
