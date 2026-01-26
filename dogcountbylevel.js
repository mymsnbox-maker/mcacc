javascript:(function(){
    document.open();
    document.write("Dog Count By Level");
    var request = new XMLHttpRequest();
    var metaRequest = new XMLHttpRequest(); 
    var dogList = [];
    var listIdx = 0;
    var dogPage = 0;
    var totalMcaccPages = void 0;   
    var totalDogs;
    var REQ = document.location.protocol
        + "//apps.pets.maricopa.gov/adoptPets/Home/AnimalGrid?sizeFilter=1&ageFilter=1&genderFilter=1&animalId=&animalName="
        + "&kennelNum=&env=https%3A%2F%2Fapps.pets.maricopa.gov%2FadoptPets&fosterEligible=false&shelterFilter=All&animalTypeFilter=All&isLongTimer=false&isReadyToday=false"
        + "&pageNumber=";
    var MREQ = document.location.protocol + "//apps.pets.maricopa.gov/adoptPets/Home/Details/";
    if (document.location.host != "apps.pets.maricopa.gov") {
        window.open('http://apps.pets.maricopa.gov/adoptPets/Home', '_blank');
    }
    request.open("GET", REQ + dogPage, true);
    request.send(null);
    var i = 0;
    request.onreadystatechange = function() {
        var done = 4, ok = 200;
        if (request.readyState == done) {
            if (request.status == ok) {
                if (request.responseText) {
                    var doc = new DOMParser().parseFromString(request.responseText, "text/html");
                    if (!totalMcaccPages) {
                        totalDogs = doc.getElementsByClassName("searchCountLabel")[0].innerText.trim().split(" ")[0];
                        totalMcaccPages = Math.floor((totalDogs - 1)/ 21) ;
                        document.write(totalDogs + " dogs to retrieve, " + totalMcaccPages + " pages");
                    }
                    [].forEach.call(
                        doc.getElementsByClassName("dogCard"), function (dc) {
                            animalId = dc.getElementsByTagName("a")[0].getAttribute("onClick").split("'")[1];
                            console.log("A#: " + animalId);
                            name = dc.querySelector(".searchPetTitleSpan").textContent.trim()
                                .replaceAll(/\b\w\S*/g, function(s) {var aPos = s.indexOf("'"); return s.substring(0, aPos+2).toUpperCase() + s.substring(aPos+2).toLowerCase();});
                            dogList[i++] = {"name": name, "animalId": animalId, "location":""};
                        }
                    );
                    console.log(dogList);
                    if (dogPage < totalMcaccPages) {
                        document.write(".");
                        dogPage++;
                        request.open("GET", REQ + dogPage, true);
                        request.send(null);
                    } else {
                        document.write("<br>Getting information on each dog ");
                        listIdx = 0;
                        metaRequest.open("GET", MREQ + dogList[listIdx].animalId, true);
                        metaRequest.send(null);
                    }
                }
            }
        }
    };

    metaRequest.onreadystatechange = function() {
        var done = 4, ok = 200;
        if (metaRequest.readyState == done) {
            if (metaRequest.status == ok) {
                if (metaRequest.responseText) {
                    var doc = new DOMParser().parseFromString(metaRequest.responseText, "text/html");
                    var level = "";
                    var location = "";
                    for (let dc of doc.body.getElementsByClassName("mb-0")) {
                        if (dc.innerText.trim().toLowerCase().startsWith("location")) {
                            location = dc.getElementsByClassName("d-block")[0].innerText.trim();
                        } else if (dc.innerText.trim().toLowerCase().startsWith("level")) {
                            level = dc.getElementsByClassName("d-block")[0].innerText.trim();
                        }
                        if (level != "" && location != "") {
                            break;
                        }
                    }
                    dogList[listIdx].level = level;
                    dogList[listIdx].location = location;
                    if (listIdx < dogList.length - 1) {
                        document.write(">");
                        listIdx++;
                        metaRequest.open("GET", MREQ + dogList[listIdx].animalId, true);
                        metaRequest.send(null);
                    } else {
                        console.log(dogList);
                        var wG=0;
                        var wP=0;
                        var wY=0;
                        var wU=0;
                        var eG=0;
                        var eP=0;
                        var eY=0;
                        var eU=0;
                        var pG=0;
                        var pP=0;
                        var pY=0;
                        var pU=0;
                        var oG=0;
                        var oP=0;
                        var oY=0;
                        var oU=0;

                        dogList.forEach(d => {
                            if (d.location.toLowerCase().includes("west")) {
                                d.level=="G"?wG++:d.level=="Y"?wY++:d.level=="P"?wP++:wU++;
                            } else if (d.location.toLowerCase().includes("east")) {
                                d.level=="G"?eG++:d.level=="Y"?eY++:d.level=="P"?eP++:eU++;
                            } else if (d.location.toLowerCase().includes("petsmart")) {
                                d.level=="G"?pG++:d.level=="Y"?pY++:d.level=="P"?pP++:pU++;
                            } else {
                                d.level=="G"?oG++:d.level=="Y"?oY++:d.level=="P"?oP++:oU++;
                            }
                        });
                        var allG = wG+eG+pG+oG;
                        var allY = wY+eY+pY+oY;
                        var allP = wP+eP+pP+oP;
                        var allU = wU+eU+pU+oU;
                        var allWest = wG+wY+wP+wU;
                        var allEast = eG+eY+eP+eU;
                        var allPM = pG+pY+pP+pU;
                        var allOther = oG+oY+oP+oU;
                        var bodyStr = "<figure>Dog Count By Level - Total # of dogs: " + totalDogs + "</figure>";
                        bodyStr += "<table border=%271%27 style=%27border-collapse:collapse%27><thead><tbody>" +
                            "<tr><td>Level</td><td>West</td><td>East</td><td>PetSmart</td><td>Other</td><td>TOTAL</td></tr>" +
                            "<tr><td>Green</td><td>"+wG+"</td><td>"+eG+"</td><td>"+pG+"</td><td>"+oG+"</td><td>"+allG+"</td></tr>" +
                            "<tr><td>Yellow</td><td>"+wY+"</td><td>"+eY+"</td><td>"+pY+"</td><td>"+oY+"</td><td>"+allY+"</td></tr>" +
                            "<tr><td>Purple</td><td>"+wP+"</td><td>"+eP+"</td><td>"+pP+"</td><td>"+oP+"</td><td>"+allP+"</td></tr>" +
                            "<tr><td>Unknown</td><td>"+wU+"</td><td>"+eU+"</td><td>"+pU+"</td><td>"+oU+"</td><td>"+allU+"</td></tr>" +
                            "<tr><td>TOTAL</td><td>"+allWest+"</td><td>"+allEast+"</td><td>"+allPM+"</td><td>"+allOther+"</td><td>"+totalDogs+"</td></tr>";
                        bodyStr += "</tbody></thead></table>";
                        document.open();
                        document.write(bodyStr);
                        var style = document.createElement("style");
                        style.innerHTML= "td {padding: 10px; font-size: 1.5em}";
                        document.head.appendChild(style);
                    }
                }
            }
        }
    };
    document.close();
})();

