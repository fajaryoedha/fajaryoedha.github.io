fetch('myassets/bio_en.json')
    .then(response => response.json())
    .then(data => {
        document.getElementById("bio_name").innerHTML = data.name
        document.getElementById("bio_fullname").innerHTML = data.name
        document.getElementById("bio_title").innerHTML = data.title
        document.getElementById("bio_moto").innerHTML = data.moto
        document.getElementById("bio_birth").innerHTML = data.birth
        document.getElementById("bio_address").innerHTML = data.address
        document.getElementById("bio_nationaly").innerHTML = data.nationaly
        data.educations.map((education, index) => {
            document.getElementById("edu_year_" + index).innerHTML = education.year
            document.getElementById("edu_name_" + index).innerHTML = education.name
            document.getElementById("edu_study_" + index).innerHTML = education.study
        })
        var skills = ""
        data.skills.map((skill, index) => {
            console.log(skill.name)
            skills += `<li class="list-group-item">
            <div class="row">
                <div class="col-2">`+ skill.name + `</div>
                <div class="col">
                    <div class="progress" style="height: 2vh;">
                        <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: `+skill.value+`%"></div>
                    </div>
                </div>
            </div>
        </li>`
        })
        document.getElementById("bio_skills").innerHTML = skills

    });