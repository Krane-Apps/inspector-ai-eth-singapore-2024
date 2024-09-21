import axios from 'axios'

const verifyProof = async (proof: string, nullifier_hash: string, merkle_root: string) => {
  try {
    const corsProxy = 'https://cors-anywhere.herokuapp.com/'
    const targetUrl = 'https://inspector-proxy.replit.app/worldId'
    
    const response = await axios.post(`${corsProxy}${targetUrl}`, {
      proof,
      nullifier_hash,
      merkle_root,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    })

    // ... rest of the function
  } catch (error) {
    console.error('Error verifying proof:', error)
    throw error
  }
}

// ... rest of the component