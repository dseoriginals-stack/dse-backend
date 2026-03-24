import axios from "axios"
import logger from "../config/logger.js"

const API_KEY = process.env.TRACKING_API_KEY
const API_URL = "https://api.17track.net/track/v2/GetTrackInfo"

export async function getTrackingInfo(trackingNo) {

  try {

    const res = await axios.post(
      API_URL,
      [
        {
          number: trackingNo
        }
      ],
      {
        headers: {
          "17token": API_KEY,
          "Content-Type": "application/json"
        }
      }
    )

    const data = res.data?.data?.accepted?.[0]

    if (!data) return null

    const events = data.track?.z0 || []

    return events.map(e => ({
      status: e.z,
      description: e.zd,
      location: e.c,
      time: e.a
    }))

  } catch (err) {

    logger.error("Tracking fetch failed", { error: err })

    return null

  }

}