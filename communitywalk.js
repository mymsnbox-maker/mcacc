javascript:(function(){
    var r = new XMLHttpRequest();
    var dR = new XMLHttpRequest();
    var dL = [];
    var li = 0;
    var p = 0;
    var C_PAGE = 21;
    var tC = 0;
    if (document.location.host != "apps.pets.maricopa.gov") {
        window.open('http://apps.pets.maricopa.gov/adoptPets/Home', '_blank');
        return false;
    }
    var shel = "East";
    var wlkType = "Hope Whispers";
    var wlkSel = prompt("Select community walk type:\nHope Whispers (h, default)\nFour Paws (f)");
    switch(wlkSel) {
        case 'f': wlkType = "Four Paws"; shel = "West"; break;
        default: break;
    }
    var showAll = confirm("Show ineligible dogs?");

    var REQ = "//apps.pets.maricopa.gov/adoptPets/Home/AnimalGrid?sizeFilter=1&ageFilter=1&genderFilter=1&kennelNum=&env=https%3A%2F%2Fapps.pets.maricopa.gov%2FadoptPets" +
        "&fosterEligible=false&animalTypeFilter=All&isLongTimer=false&isReadyToday=false&breedFilter=Any%20Breed&pageNumber=";
    var REQ2 = "&animalId=&shelterFilter=";
    document.open();
    document.write("Community Walk Dogs<br>Getting dogs for " + wlkType + " ");
    r.open( "GET", document.location.protocol + REQ + p + REQ2 + shel, true);
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
                        imgStr = imgStr.slice(0,4) + " style='max-width:200px;max-height:200px'" + imgStr.slice(4);
                        dL[li++] = {"name": name, "aId": aId, "img": imgStr};
                    });
                    tC = doc.getElementsByClassName("searchCountLabel")[0].innerText.trim().split(" ")[0];
                    if (Math.floor(tC/C_PAGE) > p) {
                        document.write(".");
                        p++;
                        r.open( "GET", document.location.protocol + REQ + p + REQ2 + shel, true);
                        r.send(null);
                    } else { 
                        document.write("<br>Getting details ");
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
        if (dR.readyState == done) {
            if (dR.status == ok) {
                if (dR.responseText) {
                    var tdy = new Date();
                    var doc = new DOMParser().parseFromString(dR.responseText, "text/html");
                    var level = "";
                    var loc = "";
                    var fee = "";
                    var isSick = false;
                    var oldDoxyDate = "";
                    var doxyDays;
                    var age = "";
                    var isPuppy;
                    var sickWing = false;
                    var eligRestricted = false;
                    var ignore = false;
                    for (let dc of doc.body.getElementsByClassName("mb-0")) {
                        if (dc.innerText.trim().toLowerCase().startsWith("location")) {
                            locF = dc.getElementsByClassName("d-block")[0].innerText.trim().split(" ");
                            let locSh = locF[0];
                            let wing = locF[locF.length-3];
                            let num = locF[locF.length-1];
                            switch (locSh.toLowerCase()) {
                                case "east":
                                    if (wing == "C" && Number(num) > 247) {
                                        sickWing = true;
                                    } else if ((wing == "Q") || (wing == "S" && Number(num) >= 206)) {
                                        eligRestricted = true;
                                    }
                                    break;
                                case "west":
                                    if (wing == "H" || wing == "I") {
                                        sickWing = true;
                                    } else if ((wing == "Q") || (wing == "S")) {
                                        eligRestricted = true;
                                    }
                                    break;
                                default: ignore = true; break;
                            }
                            loc = locSh + " " + wing + num;
                        }
                        if (dc.innerText.trim().toLowerCase().startsWith("level")) {
                            level = dc.getElementsByClassName("d-block")[0].innerText.trim();
                        }
                        if (dc.innerText.trim().toLowerCase().startsWith("age")) {
                            age = dc.getElementsByClassName("d-block")[0].innerText.trim();
                            isPuppy = false;
                            if (!age.includes("year")) {
                                if (age.includes("month")) {
                                    m = age.split("month")[0].trim();
                                    if (m < 6) {
                                        isPuppy = true;
                                    }
                                } else if (age.includes("week")) {
                                    m = age.split("week")[0].trim();
                                    if (m <= 16) {
                                        isPuppy = true;
                                    }
                                }
                            }
                        }
                        if (dc.innerText.trim().toLowerCase().startsWith("adoption")) {
                            fee = dc.getElementsByClassName("d-block")[0].innerText.trim();
                        }
                    }

                    for (let dc of doc.body.getElementsByClassName("card-header")) {
                        if (dc.innerText.trim().toLowerCase().startsWith("medical")) {
                            let cells = dc.parentElement.getElementsByClassName("card-body")[0].getElementsByTagName("td");
                            for (let c of cells) {
                                let t = c.innerText.toLowerCase();
                                let noteDate = new Date(t.trim().split("\n")[0]);
                                let pat = /move out of|no further treatment|no treatment|no active cirdc|discontinue doxy|discontinue med/;
                                if (pat.test(t)) {
                                    console.log(dL[li].aId + " " + dL[li].name + ": cleared on " + noteDate);
                                    isSick = false;
                                    break;
                                }
    
                                pat = /doxy/;
                                if (pat.test(t)) {
                                    console.log("Doxy term found: " + t);
                                    isSick = true;
                                    let noteDate = new Date(t.trim().split("\n")[0]);
                                    let tdy = new Date();
                                    let GRACE_DAYS = 18;
                                    let graceDate = new Date(noteDate);
                                    if (tdy > graceDate.setDate(graceDate.getDate() + Number(GRACE_DAYS))) {
                                        console.log(dL[li].aId + " " + dL[li].name + ": Doxy date " + noteDate.toLocaleDateString() + " too old - removing dog as sick");
                                        isSick = false;    
                                        oldDoxyDate = noteDate;
                                    }
                                    break;
                                } 
                            }
                        }
                    }

                    dL[li].loc = loc;
                    dL[li].eligRestricted = eligRestricted;
                    dL[li].ignore = ignore;
                    dL[li].level = level;
                    dL[li].age = age;
                    dL[li].isPuppy = isPuppy;
                    dL[li].fee = fee;
                    dL[li].isSick = isSick;
                    dL[li].oldDoxyDate = oldDoxyDate;
                    dL[li].sickWing = sickWing;

                    if (li < dL.length - 1) {
                        document.write(">");
                        li++;
                        dR.open( "GET", document.location.protocol + "//apps.pets.maricopa.gov/adoptPets/Home/Details/" + dL[li].aId, true);
                        dR.send(null);
                    } else {
                        console.log(dL);
                        document.open();
                        dL.sort((a, b) => a.loc.localeCompare(b.loc, 'en', { numeric: true }));
                        
                        let tdy = new Date();
                        let eligList = [];
                        let notes = "";
                        if (shel == "West") {
                            notes = "<br>Sick Wing: H & I; Restricted Wing: S"; 
                            if (!showAll) {
                                dL = dL.filter(d=>(d.level=="G" && d.ignore==false && d.isPuppy==false && d.eligRestricted==false && d.sickWing==false));
                            } else {
                                eligList = dL.filter(d=>(d.level=="G" && d.ignore==false && d.isPuppy==false && d.eligRestricted==false && d.sickWing==false));
                            }
                        } else {
                            notes = "<br>Sick Wing: C248-C283; Restricted Kennels: S206+";
                            if (!showAll) {
                                dL = dL.filter(d=>(d.level=="G" && d.ignore==false && d.isPuppy==false && d.isSick==false && d.sickWing==false));
                            } else {
                                eligList = dL.filter(d=>(d.level=="G" && d.ignore==false && d.isPuppy==false && d.isSick==false && d.sickWing==false));
                            }
                        }
                        let cnt = dL.length;
                        var bS = "<p>" + wlkType + " Report Time: " + tdy.toLocaleDateString() + " " + tdy.toLocaleTimeString() + "<br>TOTAL ROWS: " + cnt + notes + "</p>";
                        bS += "<table border='1' style='border-collapse:collapse'>";
                        dL.forEach(d => {
                            let smName = d.name.replace(" ","-").replace("'","").toLowerCase();
                            let stat = "";
                            let rStr = "<tr>";

                            if (d.oldDoxyDate) {
                                stat = "Double Check - old doxy date (" + d.oldDoxyDate.toLocaleDateString() + ") & missing vet clearance note";
                                rStr = "<tr style='background-color:lightgreen'>";
                            }
                            if (d.isSick) {
                                stat = "SICK";
                                rStr = "<tr style='background-color:lightblue'>";
                            }
                            if (d.eligRestricted) {
                                stat += "RESTRICTED KENNEL - Staff access needed";
                                rStr = "<tr style='background-color:pink'>";
                            }

                            if (showAll && eligList.find(e=>e.aId == d.aId) == undefined) {
                                rStr = "<tr style='background-color:lightgray;text-decoration:line-through;color: rgba(0,0,0,0.3)'>";
                            }
                            
                            bS += rStr +
                                "<td>" + d.img + "</td>" + 
                                "<td>" + d.name + "<br><br><a href='https://apps.pets.maricopa.gov/adoptPets/Home/Details/" + d.aId + "' target='_blank'>" + d.aId + "</a>" + "</td>" + 
                                "<td>" + d.loc + "<br><br>Level: " + d.level + "<br><br>" + d.age + "</td>" + 
                                "<td>" + stat + "</td>" +
                                "</tr>";
                        });
                        bS += "</table><figure>TOTAL ROWS: " + cnt + "</figure>";

                        document.write(bS);
                        var style = document.createElement("style");
                        style.innerHTML= "body {font-family:Arial} td {text-align:center; padding:10px; font-size:1.5em}";
                        document.head.appendChild(style);
                    }
                } 
            } 
        } 
    };
})();

