fetch('myassets/bio_in.json')
    .then(response => response.json())
    .then(data => {
        document.getElementById("bio_name").innerHTML = data.name
        document.getElementById("bio_fullname").innerHTML = data.name
        document.getElementById("bio_title").innerHTML = data.title
        document.getElementById("bio_moto").innerHTML = data.moto
        document.getElementById("bio_birth").innerHTML = data.birth
        document.getElementById("bio_address").innerHTML = data.address
        document.getElementById("bio_phone").innerHTML = data.phone
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
                <div class="timeline-image"><img class="rounded-circle img-fluid" src="`+education.img+`"
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
        var projectsStr = ""
        data.projects.map((project, index) => {
            var skillUsedStr = ""
            project.skills.map(skill => {
                skillUsedStr += skill + ', '
            })
            projectsStr += `
                <div class="col-lg-4 col-sm-6 mb-4">
                    <!-- thumbnail -->
                    <div class="portfolio-item">
                        <a class="portfolio-link" data-toggle="modal" href="#portfolioModal`+index+`">
                            <div class="portfolio-hover">
                                <div class="portfolio-hover-content"><i class="fas fa-plus fa-3x"></i></div>
                            </div>
                            <img class="img-thumbnail" src="`+project.img[0]+`" alt="" />
                        </a>
                        <div class="portfolio-caption">
                            <div class="portfolio-caption-heading">`+project.name+`</div>
                            <div class="portfolio-caption-subheading text-muted">`+project.year+`</div>
                        </div>
                    </div>
                    <!-- Modal -->
                    <div class="portfolio-modal modal fade" id="portfolioModal`+index+`" tabindex="-1" role="dialog"
                        aria-hidden="true">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="close-modal" data-dismiss="modal"><img src="assets/img/close-icon.svg"
                                        alt="Close modal" />
                                </div>
                                <div class="container">
                                    <div class="row justify-content-center">
                                        <div class="col-lg-8">
                                            <div class="modal-body">
                                                <!-- Project Details Go Here-->
                                                <h2 class="text-uppercase">`+project.name+`</h2>
                                                </p>
                                                <img class="img-fluid d-block mx-auto" src="`+project.img[1]+`" alt="" />
                                                <p>
                                                    `+project.description+`
                                                </p>
                                                <ul class="list-inline">
                                                    <li>Year : `+project.year+`</li>
                                                    <li>Used Skill : `+skillUsedStr+`</li>
                                                </ul>
                                                <button class="btn btn-primary" data-dismiss="modal" type="button">
                                                    <i class="fas fa-times mr-1"></i>
                                                    Close Project
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `
        })
        document.getElementById("bio_projects").innerHTML = projectsStr
    });