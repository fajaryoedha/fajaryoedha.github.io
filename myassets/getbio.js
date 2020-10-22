fetch('myassets/bio_en.json')
    .then(response => response.json())
    .then(data => {
        document.getElementById("bio_name").innerHTML = data.name
        document.getElementById("bio_fullname").innerHTML = data.name
        document.getElementById("bio_title").innerHTML = data.title
        document.getElementById("bio_moto").innerHTML = data.moto
        document.getElementById("bio_birth").innerHTML = data.birth
        document.getElementById("bio_address").innerHTML = data.address
        document.getElementById("bio_nationality").innerHTML = data.nationality
        document.getElementById("bio_phone").innerHTML = data.phone
        // document.getElementById("bio_whatsapp").innerHTML = data.whatsapp
        document.getElementById("bio_email").innerHTML = data.email
        var educationsStr = ""
        data.educations.map((education, index) => {
            if (index % 2) {
                educationsStr += `<li class="timeline-inverted">`
            }
            else {
                educationsStr += `<li>`
            }
            educationsStr += `
                <div class="timeline-image"><img class="rounded-circle img-fluid" src="assets/img/about/1.jpg"
                    alt="" /></div>
                <div class="timeline-panel">
                    <div class="timeline-heading">
                        <h4>` + education.year + `</h4>
                        <h4 class="subheading">`+ education.name + `</h4>
                    </div>
                    <div class="timeline-body">
                        <h5 class="text-muted">`+ education.study + `</h5>
                    </div>
                </div>
            </li>`
        })
        educationsStr += `
            <li class="timeline-inverted">
                <div class="timeline-image">
                    <h4>
                        <br/>
                        Still learn
                        <br />
                        till die!
                    </h4>
                </div>
            </li>
        `
        document.getElementById("bio_educations").innerHTML = educationsStr
        var skillsStr = ""
        data.skills.map((skill, index) => {
            let head = Math.floor(Math.random() * 6) + 1
            skillsStr += `
                <h`+ head + ` style="display: inline;">` + skill + `, </h` + head + `>
            `
        })
        document.getElementById("bio_skills").innerHTML = skillsStr

    });