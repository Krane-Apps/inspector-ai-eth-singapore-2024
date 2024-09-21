const fs = require('fs');

// Read the JSON file
fs.readFile( "packages/gaia-embedding/vulnerability.json", 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading text.json:', err);
        return;
    }

    try {
        const jsonData = JSON.parse(data);

        // Function to check if the object contains the keyword "ERC20"
        function containsERC20(obj) {
            // For each property in the object
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const value = obj[key];
                    if (typeof value === 'string' && value.includes('ERC20')) {
                        return true;
                    } else if (typeof value === 'object' && value !== null) {
                        // Recursively check nested objects
                        if (containsERC20(value)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        let filteredData;

        if (Array.isArray(jsonData)) {
            // If the JSON data is an array, filter the array
            filteredData = jsonData.filter(item => containsERC20(item));
        } else if (typeof jsonData === 'object' && jsonData !== null) {
            // If the JSON data is a single object
            if (containsERC20(jsonData)) {
                filteredData = jsonData;
            } else {
                filteredData = {};
            }
        } else {
            console.error('JSON data is neither an object nor an array.');
            return;
        }

        console.log('Filtered Data:', filteredData);

        // Write the filtered data to a new file
        fs.writeFile('filtered_text.json', JSON.stringify(filteredData, null, 2), 'utf8', (err) => {
            if (err) {
                console.error('Error writing filtered_text.json:', err);
            } else {
                console.log('Filtered data saved to filtered_text.json');
            }
        });
    } catch (parseErr) {
        console.error('Error parsing JSON data:', parseErr);
    }
});
