javascript:(function(){
    var r = new XMLHttpRequest();
    var dR = new XMLHttpRequest();
    var dL = [];
    var li = 0;
    var p = 0; var C_PAGE = 21; var tC = 0; 
    if (document.location.host != "apps.pets.maricopa.gov") { window.open('http://apps.pets.maricopa.gov/adoptPets/Home', '_blank'); } 
    var REQ_1 = "//apps.pets.maricopa.gov/adoptPets/Home/AnimalGrid?sizeFilter=1&ageFilter=1&genderFilter=1&pageNumber=";
    /*
    var locF = "East";
    var loc = prompt("Location:\n\tBlank or 'e' for East\n\t'w' for West"); switch (loc) {
        case 'e': locF = "East"; break;
        case 'w': locF = "West"; break;
        default: locF = "East"; break;
    }
    */
    var REQ_2 = "&animalId=&animalName=&kennelNum=&env=https%3A%2F%2Fapps.pets.maricopa.gov%2FadoptPets&fosterEligible=false&&animalTypeFilter=All&isLongTimer=false&isReadyToday=false&shelterFilter=All";
    
    document.open();
    document.write("Dogs By Longest Stay - All locations");
    r.open( "GET", document.location.protocol + REQ_1 + p + REQ_2, true);
    r.send(null);
    r.onreadystatechange = function() {
        var done = 4, ok = 200;
        if (r.readyState == done) {
            if (r.status == ok) {
                if (r.responseText) {
                    var doc = new DOMParser().parseFromString(r.responseText, "text/html");
                    [].forEach.call( doc.getElementsByClassName("dogCard"), function (dc) { 
                        aId = dc.getElementsByTagName("a")[0].getAttribute("onClick").split("'")[1];
                        name = dc.querySelector(".searchPetTitleSpan").textContent.trim().toUpperCase();
                        imgStr = dc.getElementsByTagName("img")[0].outerHTML;
                        imgStr = imgStr.slice(0,4) + " style='max-width:200px'" + imgStr.slice(4);
                        dL[li++] = {"name": name, "aId": aId, "img": imgStr};
                    });
                    tC = doc.getElementsByClassName("searchCountLabel")[0].innerText.trim().split(" ")[0];
                    if (Math.floor(tC/C_PAGE) > p) {
                        p++;
                        r.open( "GET", document.location.protocol + REQ_1 + p + REQ_2, true);
                        r.send(null);
                    } else {
                        document.write("Getting details ...");
                        li = 0;
                        dR.open( "GET", document.location.protocol + "//apps.pets.maricopa.gov/adoptPets/Home/Details/" + dL[li].aId, true);
                        dR.send(null);
                    } 
                }
            }
        }
    };
    dR.onreadystatechange = function() {
        var done = 4, ok = 200;
        const ONE_DAY_MS = 24*60*60*1000;
        if (dR.readyState == done) {
            if (dR.status == ok) {
                if (dR.responseText) {
                    var doc = new DOMParser().parseFromString(dR.responseText, "text/html");
                    var color = "";
                    var location = "";
                    var notes = "";
                    for (let dc of doc.body.getElementsByClassName("mb-0")) {
                        if (dc.innerText.trim().toLowerCase().startsWith("breed")) {
                            breed = dc.getElementsByClassName("d-block")[0].innerText.trim();
                        }
                        if (dc.innerText.trim().toLowerCase().startsWith("location")) {
                            location = dc.getElementsByClassName("d-block")[0].innerText.trim();
                        }
                        if (dc.innerText.trim().toLowerCase().startsWith("level")) {
                            color = dc.getElementsByClassName("d-block")[0].innerText.trim();
                        }
                        if (dc.innerText.trim().toLowerCase().startsWith("age")) {
                            age = dc.getElementsByClassName("d-block")[0].innerText.trim();
                        }
                        if (dc.innerText.trim().toLowerCase().startsWith("arrived")) {
                            arrived = dc.getElementsByClassName("d-block")[0].innerText.trim();
                        }
                    }
                    for (let dc of doc.body.getElementsByClassName("card-header")) {
                        if (dc.innerText.trim().toLowerCase().startsWith("requirements")) {
                            reqs = dc.parentElement.getElementsByClassName("card-body")[0].innerText.trim().replace(/\n\s*\n/g,'<br><br>').replace(/\s+/g,' ');
                        }
                        if (dc.innerText.trim().toLowerCase().startsWith("recommendations")) {
                            recoms = dc.parentElement.getElementsByClassName("card-body")[0].innerText.trim().replace(/\n\s*\n/g,'<br><br>').replace(/\s+/g,' ');
                        }
                    }
                    dL[li].arrived = arrived;
                    dL[li].breed = breed;
                    dL[li].age = age;
                    dL[li].location = location;
                    dL[li].level = color;
                    dL[li].arrivedFmt = new Date(arrived);
                    dL[li].reqs = reqs;
                    dL[li].recoms = recoms;

                    if (li < dL.length - 1) {
                        document.write(">");
                        li++;
                        dR.open( "GET", document.location.protocol + "//apps.pets.maricopa.gov/adoptPets/Home/Details/" + dL[li].aId, true);
                        dR.send(null);
                    } else {
                        document.open();
                        dL.sort((a,b) => a.arrivedFmt - b.arrivedFmt);
                        t = new Date();
                        var bodyStr = "<figure>DogsByLongestStay " + t.toLocaleDateString() + " " + t.toLocaleTimeString() + "<br>TOTAL ROWS: " + tC + "</figure>";
                        bodyStr += "<table border='1' style='border-collapse:collapse'>";
                        dL.forEach(d => {
                            bodyStr += "<tr>" +
                                /*"<td>" + d.img + "</td>" + */
                                "<td>" + d.arrived + "</td>" +
                                "<td>" + Math.round(Math.abs((t - d.arrivedFmt)/ONE_DAY_MS)) + "</td>" + 
                                "<td>" + d.name + "<br><br>" + 
                                    "<a href='https://apps.pets.maricopa.gov/adoptPets/Home/Details/" + d.aId + "' target='_blank'>" + d.aId + "</a></td>" +
                                "<td>" + d.location + "<br><br>Age:" + d.age + "<br><br>" + d.level + "</td>" + 
                                "<td>" + d.breed + "</td>" + 
                                "<td>" + d.reqs + "</td>" + 
                                "<td>" + d.recoms + "</td>" +
                                "</tr>";
                        });
                        bodyStr += "</table>";
                        bodyStr += "<figure>TOTAL ROWS: " + tC + "</figure>";
                        document.write(bodyStr);
                        var style = document.createElement("style");
                        style.innerHTML= "body {font-family:Arial} " + 
                            "td {text-align:center; padding:10px; font-size:1.5em} b {background-color:yellow}";
                        document.head.appendChild(style);
                    }
                } 
            } 
        } 
    };
    document.close();
})();

