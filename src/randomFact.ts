import axios from 'axios'

export async function fetchRandomFact() {
    const response = await axios.get("https://uselessfacts.jsph.pl/api/v2/facts/random");
    return response.data.text;
  }