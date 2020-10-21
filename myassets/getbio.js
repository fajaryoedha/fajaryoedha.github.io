fetch('myassets/bio_en.json')
    .then(response => response.json())
    .then(data => {
        console.log(data)
        document.getElementById("bio_name").innerHTML = data.name
        document.getElementById("bio_moto").innerHTML = data.moto
    });