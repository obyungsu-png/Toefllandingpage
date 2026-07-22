const fs = require('fs');

function csvEscape(val) {
  const s = String(val ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function makeRow(arr) { return arr.map(csvEscape).join(','); }

// ── Reading ─────────────────────────────────────────────────────────
const readingHeader = 'questionNumber,questionType,difficulty,module,passageTitle,passageText,scriptText,dictationBlanks,organization,organizationBlanks,questionText,optionA,optionB,optionC,optionD,correctAnswer,explanation,audioFileName,imageFileName';
const readingRows = [];

// Module 1 — Complete Words Q1-10 (Supply and Demand)
readingRows.push(makeRow([
  '1-10','Complete Words','보통','Module 1','Supply and Demand',
  'Supply and demand are fundamental concepts in economics because they determine the price and availability of goods or services. When the[re] is mo[re] demand f[or] a pro[duct], suppliers m[ay] make i[t] more expe[nsive] to incr[ease] profits. Conve[rsely], an exc[ess] supply can lead to price reductions. Market equilibrium occurs when supply matches demand, resulting in stable prices. The real world, however, is rarely as simple as this. Various factors influence these dynamics, including consumer preferences, production costs, and external events.',
  '','','','','Fill in the missing letters in the paragraph.','','','','','','',''
]));

// Module 1 — Complete Words Q11-20 (Sanitation)
readingRows.push(makeRow([
  '11-20','Complete Words','보통','Module 1','Sanitation',
  'The introduction of sanitation practices in urban areas during the nineteenth century significantly improved public health. Innovations such as sew[age] systems a[nd] clean wa[ter] supplies deve[loped] from t[he] growing aware[ness] of the conne[ction] between po[or] hygiene and ill[ness], and reduced the spre[ad] of infectious diseases like cholera and typhoid. Public health campaigns, supported by local governments and medical professionals, educated communities on the importance of hygiene. These efforts were instrumental in decreasing mortality rates and enhancing quality of life.',
  '','','','','Fill in the missing letters in the paragraph.','','','','','','',''
]));

// Module 1 — Q21-22 Webpage (Williamsville College Gardening Club)
const webpageJson = JSON.stringify({
  structure: 'form',
  color: 'teal',
  fields: {
    title: 'Williamsville College Gardening Club',
    body: "We're a student club promoting sustainable gardening in collaboration with our neighbors in the town of Williamsville. Any skill level is welcome!\n\nUpcoming Event:\nPlant Sale • Farnese Pavilion • March 15, 2:00 p.m.\n\nLearn more about our club and future events on our website or email gardeningclub@williamsville.edu."
  }
});
readingRows.push(makeRow([
  '21','Read in Daily Life','보통','Module 1','Read a webpage',
  webpageJson,'','','','','What is indicated about the Williamsville College Gardening Club?',
  'It prioritizes competitive gardening.','It focuses on vegetable gardening.','It practices eco-friendly gardening.','It teaches professional gardening.',
  'It practices eco-friendly gardening.','','',''
]));
readingRows.push(makeRow([
  '22','Read in Daily Life','보통','Module 1','Read a webpage',
  webpageJson,'','','','','What can be concluded about the people who participate in Williamsville College Gardening Club activities?',
  'They are primarily professors and administrators who work at Williamsville College.','They are a mixture of Williamsville College students and non-student residents of Williamsville.','They are a mixture of high school and college students from the area.','They are a group of local gardening professionals working in the area.',
  'They are a mixture of Williamsville College students and non-student residents of Williamsville.','','',''
]));

// Module 1 — Q23-25 Advertisement (Winter Student Trek)
const adJson = JSON.stringify({
  structure: 'article',
  color: 'teal',
  fields: {
    headline: 'Winter Student Trek',
    body: "Looking for the ultimate winter break escape? AlpineAdventures invites you to embark on an unforgettable journey through the Swiss Alps—the perfect mix of adventure, culture, and relaxation for your vacation. Our seven-day Winter Student Trek is designed for both first-time explorers and seasoned adventurers eager to experience Switzerland's breathtaking winter landscapes.\n\nHighlights:\n• Snow-dusted valleys with alpine air that refreshes body and mind\n• Thrilling mountain trails with views of legendary peaks\n• Cozy alpine lodges, complete with hearty Swiss meals and warm hospitality\n• Incredible wildlife, from elusive ibexes to soaring eagles\n• Meticulously curated daily challenges await you: Each day brings excitement and discovery.\n\nAll-inclusive:\n• Multilingual expert Alpine guides\n• Delicious meals with Swiss specialties\n• Comfortable accommodations with stunning vistas\n• Round-trip transportation to the trailhead\n\nTo foster team building, units include no more than six students. Space is very limited, so grab your spot! Email booking@alpineadventures.ch to reserve your winter break adventure today."
  }
});
readingRows.push(makeRow([
  '23','Read in Daily Life','보통','Module 1','Read an advertisement',
  adJson,'','','','','What is indicated about the seven-day Winter Student Trek?',
  'It provides exclusive access to private ski slopes.','It will be led by professionals with local expertise.','It includes complimentary ski and snowboard rentals.','It offers cooking classes led by professional chefs.',
  'It will be led by professionals with local expertise.','','',''
]));
readingRows.push(makeRow([
  '24','Read in Daily Life','보통','Module 1','Read an advertisement',
  adJson,'','','','','Students should probably avoid participating in the seven-day Winter Student Trek if they',
  'prefer large groups when joining activities','like to observe wildlife in its natural habitat','enjoy discovering new cultures and places','appreciate customized guidance from experts',
  'prefer large groups when joining activities','','',''
]));
readingRows.push(makeRow([
  '25','Read in Daily Life','보통','Module 1','Read an advertisement',
  adJson,'','','','','Given the description of the seven-day Winter Student Trek, which of the following is true of Alpine Adventures?',
  'It emphasizes a balance between physical challenge and cultural immersion.','It prioritizes solitary travel experiences over group tour activities.','It primarily targets professional mountaineers seeking challenging climbs.','It offers a range of budget-friendly options for student travelers.',
  'It emphasizes a balance between physical challenge and cultural immersion.','','',''
]));

// Module 1 — Q26-30 Academic Passage (Data Visualization)
const dvPassage = `Data visualization is transforming how we interpret complex datasets, moving beyond traditional charts, such as static charts and graphs, to dynamic graphical representations, such as heat maps, time-lapse animations, and network graphs. This shift allows for the discovery of patterns and anomalies otherwise hidden in raw data. For example, when studying climate change impacts, a time-lapse heat map might reveal unexpected temperature shifts over decades that spreadsheets alone could not capture.

A significant development in this field is the use of interactive dashboards. These tools not only display data but also allow users to manipulate variables to explore different scenarios. In the business sector, decision-makers use dashboards to simulate market conditions, adjusting factors like demand and supply to forecast outcomes. However, the effectiveness of these dashboards often hinges on the user's ability to interpret complex visual cues, which can be overwhelming.

In the realm of public health, data visualization has proven invaluable in tracking disease spread. The combination of geographical maps and timelines helps analysts predict outbreak hot spots. Nonetheless, this predictive power depends heavily on the quality of data inputs. Still, data visualization tools help public health officials to act before a situation becomes unmanageable.`;

readingRows.push(makeRow([
  '26','Read an Academic Passage','보통','Module 1','Data Visualization in Action',
  dvPassage,'','','','','The word "anomalies" in the passage is closest in meaning to',
  'irregularities','indications','solutions','links',
  'irregularities','','',''
]));
readingRows.push(makeRow([
  '27','Read an Academic Passage','보통','Module 1','Data Visualization in Action',
  dvPassage,'','','','','What does the passage suggest about traditional data charts?',
  'They reveal some important features hidden in raw data.','They are limited in how effectively they convey complex information.','They are especially helpful in capturing data related to climate change.','They include heat maps, time-lapse animations, and network graphs.',
  'They are limited in how effectively they convey complex information.','','',''
]));
readingRows.push(makeRow([
  '28','Read an Academic Passage','보통','Module 1','Data Visualization in Action',
  dvPassage,'','','','','Identify the sentence in paragraph 2 that highlights a limitation of interactive dashboards. Select the sentence to make your choice.',
  'A significant development in this field is the use of interactive dashboards.','These tools not only display data but also allow users to manipulate variables to explore different scenarios.','However, the effectiveness of these dashboards often hinges on the user\'s ability to interpret complex visual cues, which can be overwhelming.','In the business sector, decision-makers use dashboards to simulate market conditions, adjusting factors like demand and supply to forecast outcomes.',
  'However, the effectiveness of these dashboards often hinges on the user\'s ability to interpret complex visual cues, which can be overwhelming.','','',''
]));
readingRows.push(makeRow([
  '29','Read an Academic Passage','보통','Module 1','Data Visualization in Action',
  dvPassage,'','','','','The passage mentions all the following about interactive dashboards EXCEPT:',
  'They represent an important development in data analysis tools.','They let users change variables to see different outcomes.','They can be used to explore how markets might behave.','They help business leaders interact more effectively with one another.',
  'They help business leaders interact more effectively with one another.','','',''
]));
readingRows.push(makeRow([
  '30','Read an Academic Passage','보통','Module 1','Data Visualization in Action',
  dvPassage,'','','','','There are four locations in the passage that indicate where the following sentence could be added: "Incomplete or biased data can lead to misleading conclusions, potentially hampering response efforts." Where would the sentence best fit?',
  'Location 1','Location 2','Location 3','Location 4',
  'Location 3','','',''
]));

// Module 1 — Q31-35 Academic Passage (Plant Communication)
const pcPassage = `The discovery that plants use communication has changed our understanding of plant behavior and ecology. Traditionally, plants were considered passive organisms, reacting to environmental changes rather than actively engaging with their surroundings. However, studies have shown that plants can send chemical signals through the soil. These signals, often carried by root exudates (substances released by the plants' roots into the soil), can inform neighboring plants about threats like plant-eating animals or disease-causing agents. For instance, when a corn plant is attacked by caterpillars, it can release specific chemicals that warn nearby corn plants. In response, the neighboring corn plants may release a chemical known as MBOA into their tissues, which makes them less palatable to the caterpillars.

Plants also use electrical signals to respond rapidly to environmental changes. These signals travel through the plant, allowing it to adjust resource allocation. Some plants can even detect the presence of other plants through their roots. This allows them to alter their growth patterns to avoid direct competition.

Despite these discoveries, the study of plant communication is still in its infancy. Researchers are continuously uncovering new ways that plants interact with each other and their environment.`;

readingRows.push(makeRow([
  '31','Read an Academic Passage','보통','Module 1','Plant Communication',
  pcPassage,'','','','','According to the passage, there used to be a mistaken view that plants',
  'often changed their behavior','released root exudates only in small amounts','were not significantly affected by ecological factors','did not actively interact with other plants',
  'did not actively interact with other plants','','',''
]));
readingRows.push(makeRow([
  '32','Read an Academic Passage','보통','Module 1','Plant Communication',
  pcPassage,'','','','','According to the passage, corn plants may release MBOA into their tissues in response to',
  'harmful chemicals released by caterpillars','electrical signals in the soil','human activities that alter the environment','root exudates produced by other corn plants',
  'harmful chemicals released by caterpillars','','',''
]));
readingRows.push(makeRow([
  '33','Read an Academic Passage','보통','Module 1','Plant Communication',
  pcPassage,'','','','','What can be inferred to be the purpose of electrical signals that plants release?',
  'To attract beneficial animals to the plants','To prevent attack by caterpillars on the plants','To help the plants make the best use of available resources','To communicate with other plants across long distances',
  'To help the plants make the best use of available resources','','',''
]));
readingRows.push(makeRow([
  '34','Read an Academic Passage','보통','Module 1','Plant Communication',
  pcPassage,'','','','','Knowledge about the presence of other plants can help a plant to',
  'change its growth in a way that reduces competition','prevent major damage to its roots','identify additional resources','determine which chemicals to release into the soil',
  'change its growth in a way that reduces competition','','',''
]));
readingRows.push(makeRow([
  '35','Read an Academic Passage','보통','Module 1','Plant Communication',
  pcPassage,'','','','','The phrase "still in its infancy" in the passage is closest in meaning to',
  'highly controversial','in a difficult period','looking for funding','at an early stage',
  'at an early stage','','',''
]));

// Module 2 — Q1-10 Complete Words (Water and Volcanic Activity)
readingRows.push(makeRow([
  '1-10','Complete Words (Module 2)','보통','Module 2','Water and Volcanic Activity',
  'The discovery of water and volcanic activity on moons like Europa and Enceladus has sparked interest in the potential for extraterrestrial life. These moons, orbi[ting] the pla[nets] Jupiter a[nd] Saturn, ha[ve] ice-covered surfaces, with oce[ans] lying underneath. Volcanic acti[vity], in t[he] form o[f] hydrothermal vents, provides heat and nutrients, creating environments where microbial life could potentially thrive. Missions by spacecraft such as the Galileo and Cassini have gathered valuable data on these moons.',
  '','','','','Fill in the missing letters in the paragraph.','','','','','','',''
]));

// Module 2 — Q11-15 Academic Passage (The Political Legacy of the Roman Empire)
const romePassage = `The fall of the Roman Empire reshaped the geopolitical landscape of Europe and the Mediterranean in profound ways. One widely accepted hypothesis is that the collapse of Roman administrative and military structures led to the fragmentation of centralized authority. Without Rome's unifying legal framework, power devolved to local warlords and tribal leaders, paving the way for feudalism and a mosaic of competing kingdoms. This decentralization fostered chronic instability, as seen in the frequent conflicts among the Franks, Visigoths, and Lombards.

However, some scholars argue that this fragmentation was not purely detrimental. The absence of a dominant empire may have encouraged regional innovation and adaptability. For instance, the Carolingian Renaissance under Charlemagne suggests that localized rule could still produce cultural and intellectual flourishing. The emergence of monastic communities during this period also played a crucial role in preserving classical knowledge and fostering educational continuity across fragmented territories.

Another compelling example is the Byzantine Empire, which retained Roman governance in the East and acted as a stabilizing force for centuries. Its survival challenges the notion that imperial collapse inevitably leads to disorder.

While the fall of Rome dismantled a centralized system, it also opened space for diverse political experiments—some chaotic, and others surprisingly resilient.`;

readingRows.push(makeRow([
  '11','Read an Academic Passage (Module 2)','보통','Module 2','The Political Legacy of the Roman Empire',
  romePassage,'','','','','The word "fostered" in the passage is closest in meaning to',
  'accepted','revealed','preceded','promoted',
  'promoted','','',''
]));
readingRows.push(makeRow([
  '12','Read an Academic Passage (Module 2)','보통','Module 2','The Political Legacy of the Roman Empire',
  romePassage,'','','','','Which of the following best describes the main purpose of paragraph 1?',
  'To highlight the cultural achievements that followed the Roman Empire\'s collapse','To argue that the fall of Rome had minimal impact on European governance','To present a common explanation for the political fragmentation after Rome\'s fall','To explain the decline of the Roman Empire in the face of competing kingdoms',
  'To present a common explanation for the political fragmentation after Rome\'s fall','','',''
]));
readingRows.push(makeRow([
  '13','Read an Academic Passage (Module 2)','보통','Module 2','The Political Legacy of the Roman Empire',
  romePassage,'','','','','Why does the author mention the Carolingian Renaissance?',
  'To illustrate that cultural growth was still possible despite political fragmentation','To show how Charlemagne attempted to restore the Roman Empire\'s boundaries','To argue that feudalism was a direct result of the Roman Empire\'s policies','To explain the role of military conflicts in shaping post-Roman Europe',
  'To illustrate that cultural growth was still possible despite political fragmentation','','',''
]));
readingRows.push(makeRow([
  '14','Read an Academic Passage (Module 2)','보통','Module 2','The Political Legacy of the Roman Empire',
  romePassage,'','','','','The passage mentions each of the following as a consequence of the Roman Empire\'s collapse EXCEPT',
  'the rise of feudalism and competing regional kingdoms','the expansion of the Byzantine Empire into Western Europe','the preservation of classical knowledge in monastic communities','the transfer of political authority to local leaders',
  'the expansion of the Byzantine Empire into Western Europe','','',''
]));
readingRows.push(makeRow([
  '15','Read an Academic Passage (Module 2)','보통','Module 2','The Political Legacy of the Roman Empire',
  romePassage,'','','','','There are four locations in the passage that indicate where the following sentence could be added: "Such developments suggest that decentralization may have inadvertently laid the groundwork for a more pluralistic and resilient intellectual tradition." Where would the sentence best fit?',
  'Location 1','Location 2','Location 3','Location 4',
  'Location 1','','',''
]));

fs.writeFileSync('csv_3.30_reading_tpo.csv', [readingHeader, ...readingRows].join('\n'), 'utf-8');
console.log('Created: csv_3.30_reading_tpo.csv (' + readingRows.length + ' rows)');

// ── Listening ────────────────────────────────────────────────────────
const listeningHeader = readingHeader;
const listeningRows = [];

// Module 1 — Listen and Response Q1-12
const lrData = [
  ['1','Listen and Response','보통','Module 1','','','','','','','Choose the best response.','At the bus stop.','In ten minutes.','Across the street.','Sure, let\'s go.','In ten minutes.'],
  ['2','Listen and Response','보통','Module 1','','','','','','','Choose the best response.','I didn\'t realize you worked at the dining hall.','For cleaning the tables at the campus café.','Personally, I prefer going out with friends.','Surprisingly, it wasn\'t that expensive.','Personally, I prefer going out with friends.'],
  ['3','Listen and Response','보통','Module 1','','','','','','','Choose the best response.','It goes to the airport.','It\'s a fast train.','Not until tomorrow morning.','I got an early start.','Not until tomorrow morning.'],
  ['4','Listen and Response','보통','Module 1','','','','','','','Choose the best response.','Exercise is important for our well-being.','No, unfortunately I hurt my ankle.','I recently discovered a good one that\'s not too far.','Tomorrow would be better.','I recently discovered a good one that\'s not too far.'],
  ['5','Listen and Response','보통','Module 1','','','','','','','Choose the best response.','The dining hall is open on Sundays.','I\'ve never been inside.','His parties are always festive.','I\'ll do it first thing after class tomorrow.','I\'ve never been inside.'],
  ['6','Listen and Response','보통','Module 1','','','','','','','Choose the best response.','Only on weekdays?','I don\'t know how to.','Feeling relieved?','They arrived late last night.','Feeling relieved?'],
  ['7','Listen and Response','보통','Module 1','','','','','','','Choose the best response.','It wasn\'t as exciting as I hoped it would be.','Do you want to go for a swim at the campus pool?','I always enjoy a good meal at the dining hall.','No, I haven\'t joined the student activities committee.','It wasn\'t as exciting as I hoped it would be.'],
  ['8','Listen and Response','보통','Module 1','','','','','','','Choose the best response.','The class is exciting.','Yes, I study with Sarah.','It\'s been a few years now.','I\'ve enjoyed my time here.','It\'s been a few years now.'],
  ['9','Listen and Response','보통','Module 1','','','','','','','Choose the best response.','The soccer coach is really good.','I love to sing, but I\'m too busy.','Practice is the key to success.','I hear that the chef is excellent.','I love to sing, but I\'m too busy.'],
  ['10','Listen and Response','보통','Module 1','','','','','','','Choose the best response.','Yes, I have a few ideas.','Yes, I read it yesterday.','The laboratory is on campus.','It felt good to finish on time.','Yes, I have a few ideas.'],
  ['11','Listen and Response','보통','Module 1','','','','','','','Choose the best response.','It\'s on modern technology.','Because students requested it.','It\'s part of the lecture series.','A visiting researcher.','A visiting researcher.'],
  ['12','Listen and Response','보통','Module 1','','','','','','','Choose the best response.','Our grades will be posted tomorrow.','The dorm supervisor is authorized to sign for it.','It was sent yesterday.','You can track the status online.','You can track the status online.'],
];
lrData.forEach(r => listeningRows.push(makeRow([...r,'','',''])));

// Module 1 — Short Conversation Q13-18
listeningRows.push(makeRow(['13','Short Conversation','보통','Module 1','Listen to a conversation.','','','','','','What does the woman imply about her cookies?','They included some chocolate.','They were baked based on a new recipe.','They ended up too hard.','They were sugar-free.','They ended up too hard.','','','']));
listeningRows.push(makeRow(['14','Short Conversation','보통','Module 1','Listen to a conversation.','','','','','','What will the woman do next?','Read her recipe book','Give the man some chocolate cake','Buy some ingredients','Call a store','Buy some ingredients','','','']));
listeningRows.push(makeRow(['15','Short Conversation','보통','Module 1','Listen to a conversation.','','','','','','What is the man\'s complaint about "WBSC in Washington"?','The plot is difficult to follow.','The humor is unoriginal.','The episodes are too long.','The show airs too late at night.','The plot is difficult to follow.','','','']));
listeningRows.push(makeRow(['16','Short Conversation','보통','Module 1','Listen to a conversation.','','','','','','What does the woman suggest about "WBSC in Washington"?','It replaced its writers from last season.','It is moving to a new time slot.','It is in its final season.','It is the subject of false rumors.','It is moving to a new time slot.','','','']));
listeningRows.push(makeRow(['17','Short Conversation','보통','Module 1','Listen to a conversation.','','','','','','What are the speakers discussing?','A movie','A theatrical production','A music concert','A comedy show','A theatrical production','','','']));
listeningRows.push(makeRow(['18','Short Conversation','보통','Module 1','Listen to a conversation.','','','','','','What will the man do?','Sell some items','Perform on stage','Get tickets','Post something online','Get tickets','','','']));

// Module 1 — Announcements Q19-24
listeningRows.push(makeRow(['19','Announcements','보통','Module 1','Listen to an announcement at a university event.','','','','','','What does the speaker imply about last year\'s event?','The speeches ran much longer than expected.','Multiple speakers did not show up.','Several attendees were inappropriately dressed.','Noise from phones caused frequent disruptions.','Noise from phones caused frequent disruptions.','','','']));
listeningRows.push(makeRow(['20','Announcements','보통','Module 1','Listen to an announcement at a university event.','','','','','','What does the speaker say about tickets for the event?','They are only available digitally.','They are no longer on sale.','They can be obtained from the box office.','They include a copy of the dress code.','They can be obtained from the box office.','','','']));
listeningRows.push(makeRow(['21','Announcements','보통','Module 1','Listen to a school radio announcement.','','','','','','According to the speaker, what change will begin next week?','New programs will be installed on the computers in the lab.','Equipment will have to be shut down by a specific time.','A computer lab will be closed in the afternoon.','Students will have to log in with different credentials.','Equipment will have to be shut down by a specific time.','','','']));
listeningRows.push(makeRow(['22','Announcements','보통','Module 1','Listen to a school radio announcement.','','','','','','What does the speaker recommend listeners do?','Use the computer lab in the evening','Reserve space in the computer lab in advance','Create a personal account','Save and back up all computer files','Reserve space in the computer lab in advance','','','']));
listeningRows.push(makeRow(['23','Announcements','보통','Module 1','Listen to a school radio announcement.','','','','','','What does the speaker remind the students about?','A revised class schedule','A time change','A club sign-up','A campus art installation','A time change','','','']));
listeningRows.push(makeRow(['24','Announcements','보통','Module 1','Listen to a school radio announcement.','','','','','','What does the speaker express appreciation for?','Energy conservation work','Warmer weather','A recent donation','A club\'s efforts','A club\'s efforts','','','']));

// Module 1 — Academic Talk Q25-28 (Archaeology)
const archTitle = 'Listen to a talk in an archaeology class.';
listeningRows.push(makeRow(['25','Academic Talk','보통','Module 1',archTitle,'','','','','','What is the main focus of the talk?','Ways in which ancient peoples supplied nitrogen and moisture to their fields','Similarities between gardens of ancient Rome and Central America','A method for studying planting practices of ancient cultures','An example of how modern agriculture can learn to benefit from ancient knowledge','A method for studying planting practices of ancient cultures','','','']));
listeningRows.push(makeRow(['26','Academic Talk','보통','Module 1',archTitle,'','','','','','Why do researchers inject plaster into soil?','To make the soil more stable','To protect plant roots in the soil','To replicate an ancient practice that existed in different parts of the world','To obtain casts that match decayed material in shape','To obtain casts that match decayed material in shape.','','','']));
listeningRows.push(makeRow(['27','Academic Talk','보통','Module 1',archTitle,'','','','','','What does the speaker say is a main feature of the agricultural system practiced in the Maya village in Central America?','It takes advantage of plants that do not decay quickly.','It combines a variety of crops that support each other\'s growth.','It relies on a complex irrigation system.','It changes crops from year to year.','It combines a variety of crops that support each other\'s growth.','','','']));
listeningRows.push(makeRow(['28','Academic Talk','보통','Module 1',archTitle,'','','','','','What does the speaker imply about Roman garden designers?','They tried to replicate nature.','They considered roses to be more beautiful than other flowers.','They valued both beauty and practicality.','They were interested in foreign plant species.','They valued both beauty and practicality.','','','']));

// Module 1 — Academic Talk Q29-32 (Literature)
const litTitle = 'Listen to a talk in a literature class.';
listeningRows.push(makeRow(['29','Academic Talk','보통','Module 1',litTitle,'','','','','','What is the main topic of the talk?','How mythology has shaped cultural traditions','Joseph Campbell\'s influence on storytelling techniques','The structure and significance of the hero\'s journey','Criticism of modern storytelling practices','The structure and significance of the hero\'s journey','','','']));
listeningRows.push(makeRow(['30','Academic Talk','보통','Module 1',litTitle,'','','','','','What point does the speaker make about Joseph Campbell?','He invented the hero\'s journey as a new storytelling model.','He examined why readers are drawn to heroic actions in stories.','He was best known for writing fiction based on ancient stories.','He found that stories from different cultures share a similar pattern.','He found that stories from different cultures share a similar pattern.','','','']));
listeningRows.push(makeRow(['31','Academic Talk','보통','Module 1',litTitle,'','','','','','Why does the speaker mention a gift?','To show appreciation for storytellers\' creative talents','To point out what makes the hero\'s journey meaningful','To describe what the hero receives from a mentor','To highlight the hero\'s motivation for starting the journey','To describe what the hero receives from a mentor','','','']));
listeningRows.push(makeRow(['32','Academic Talk','보통','Module 1',litTitle,'','','','','','What is the speaker\'s opinion about the hero\'s journey in storytelling?','It is outdated and no longer relevant.','It limits creativity by focusing only on action and adventure.','It is influential because it reflects shared human experiences.','It has become more popular due to its use in film and media.','It is influential because it reflects shared human experiences.','','','']));

// Module 2 — Listen and Response Q1-3
const lrM2 = [
  ['1','Listen and Response (Module 2)','보통','Module 2','','','','','','','Choose the best response.','Yes, my vehicle is in the shop for repairs.','Yes, I bought some of them yesterday.','No, motorized vehicles aren\'t allowed on campus.','Great, I\'d love to accessorize my outfit with some jewelry.','Yes, I bought some of them yesterday.'],
  ['2','Listen and Response (Module 2)','보통','Module 2','','','','','','','Choose the best response.','It held my attention the entire time.','I need to finish my homework first.','I was thrilled to see her as well.','That sounds like a great class to take.','It held my attention the entire time.'],
  ['3','Listen and Response (Module 2)','보통','Module 2','','','','','','','Choose the best response.','Maybe. I\'ll think about it.','It was crowded.','Can we look at the schedule, please?','He\'ll start a new job soon.','It was crowded.'],
];
lrM2.forEach(r => listeningRows.push(makeRow([...r,'','',''])));

// Module 2 — Short Conversation Q4-7
listeningRows.push(makeRow(['4','Short Conversation (Module 2)','보통','Module 2','Listen to a conversation.','','','','','','Why is the woman interested in water aerobics?','She wants to get more exercise.','She prefers them to swimming laps.','The classes fit easily into her schedule.','The motions are good for her back.','She wants to get more exercise.','','','']));
listeningRows.push(makeRow(['5','Short Conversation (Module 2)','보통','Module 2','Listen to a conversation.','','','','','','What past problem does the man mention?','He accidentally threw out an important paper.','He lost a key when jumping into the pool.','He injured himself during a workout.','He used to be scared of going underwater.','He injured himself during a workout.','','','']));
listeningRows.push(makeRow(['6','Short Conversation (Module 2)','보통','Module 2','Listen to a conversation.','','','','','','What does the man invite the woman to do?','Meet his friends','Work with him','Visit a local neighborhood','Borrow a book','Work with him.','','','']));
listeningRows.push(makeRow(['7','Short Conversation (Module 2)','보통','Module 2','Listen to a conversation.','','','','','','Why does the woman mention lawn mowers?','To identify a lack of skill','To describe a new interest','To make a recommendation','To discuss a recent purchase','To identify a lack of skill.','','','']));

// Module 2 — Academic Talk Q8-11 (Biology - Migration)
const bioM2Title = 'Listen to a talk in a biology class.';
listeningRows.push(makeRow(['8','Academic Talk (Module 2)','보통','Module 2',bioM2Title,'','','','','','What is the main topic of the talk?','The feeding habits of migratory animals','Animal migration and its characteristics','Challenges faced by migratory species','Navigational methods used by migrating animals','Animal migration and its characteristics','','','']));
listeningRows.push(makeRow(['9','Academic Talk (Module 2)','보통','Module 2',bioM2Title,'','','','','','Why does the speaker mention human pilots?','To illustrate the complexity of animal navigation','To suggest that birds might follow flight paths','To discuss the impact of airplanes on the climate','To describe human interference in migration','To illustrate the complexity of animal navigation.','','','']));
listeningRows.push(makeRow(['10','Academic Talk (Module 2)','보통','Module 2',bioM2Title,'','','','','','What is unusual about the migration of monarch butterflies?','They migrate from a colder to a warmer region.','Their migration requires precise navigation skills.','A single migration occurs over multiple generations.','A migrating monarch eats nothing until it reaches its destination.','A single migration occurs over multiple generations.','','','']));
listeningRows.push(makeRow(['11','Academic Talk (Module 2)','보통','Module 2',bioM2Title,'','','','','','Why does the speaker mention "human-made obstacles"?','To explain how animals adapt to urban environments','To contrast migration by sea to migration over land','To describe a common reason for animal migration','To emphasize the need to protect migratory routes','To emphasize the need to protect migratory routes.','','','']));

// Module 2 — Academic Talk Q12-15 (Ecology - Galapagos)
const ecoM2Title = 'Listen to a talk on an ecology podcast.';
listeningRows.push(makeRow(['12','Academic Talk (Module 2)','보통','Module 2',ecoM2Title,'','','','','','What was the main reason animals were moved from one island in the Galapagos to another island?','To restore an ecosystem','To increase tourism','To prevent the animals from becoming extinct','To provide the animals with better living conditions','To restore an ecosystem.','','','']));
listeningRows.push(makeRow(['13','Academic Talk (Module 2)','보통','Module 2',ecoM2Title,'','','','','','What difference does the speaker point out between Santa Fe Island and Española Island?','One island is closer to the mainland than the other.','More tourists visit one island than the other.','There are more species of cactus on one island than on the other.','Tortoises went extinct on one island but not the other.','Tortoises went extinct on one island but not the other.','','','']));
listeningRows.push(makeRow(['14','Academic Talk (Module 2)','보통','Module 2',ecoM2Title,'','','','','','What does the speaker say about a species of cactus?','It is only eaten by one species of tortoise.','It produces fruit that is larger than the fruit of other plants.','It has benefited from the reintroduction of a species of tortoise.','It has seeds that are difficult for animals to digest.','It has benefited from the reintroduction of a species of tortoise.','','','']));
listeningRows.push(makeRow(['15','Academic Talk (Module 2)','보통','Module 2',ecoM2Title,'','','','','','What does the speaker say about the results of a conservation project?','It is too early to determine if its goals have been achieved.','It has only been successful for certain types of animals.','It is too expensive to repeat in other parts of the world.','It is taking more time than conservationists expected.','It has only been successful for certain types of animals.','','','']));

fs.writeFileSync('csv_3.30_listening_tpo.csv', [listeningHeader, ...listeningRows].join('\n'), 'utf-8');
console.log('Created: csv_3.30_listening_tpo.csv (' + listeningRows.length + ' rows)');

// ── Writing (QuestionTypeCMS format) ────────────────────────────────
const writingHeader = 'questionNumber,questionType,difficulty,level,day,passageTitle,passageText,scriptText,dictationBlanks,organization,organizationBlanks,questionText,optionA,optionB,optionC,optionD,correctAnswer,explanation,context';
const writingRows = [];

// Q1-10 Build a Sentence
const bsData = [
  ['1','Build a Sentence','보통','1','01','','','','','','Make an appropriate sentence.','','','','','What time are you planning to arrive','','I\'m going to attend the grand opening of the new student center this weekend.'],
  ['2','Build a Sentence','보통','1','01','','','','','','Make an appropriate sentence.','','','','','I have never been interested in those types of events','','Are you planning to attend the English language learning conference next month?'],
  ['3','Build a Sentence','보통','1','01','','','','','','Make an appropriate sentence.','','','','','Can you tell me if any of the messages were important','','A biology professor sent us three emails this morning.'],
  ['4','Build a Sentence','보통','1','01','','','','','','Make an appropriate sentence.','','','','','Someone else had checked it out so it was not available','','Did you manage to find the book you were looking for at the library?'],
  ['5','Build a Sentence','보통','1','01','','','','','','Make an appropriate sentence.','','','','','Do you know how many weeks it will be there?','','A temporary art exhibition is opening at the campus museum today.'],
  ['6','Build a Sentence','보통','1','01','','','','','','Make an appropriate sentence.','','','','','Can you tell me whether the data is reliable','','What did you think about our group report on climate change?'],
  ['7','Build a Sentence','보통','1','01','','','','','','Make an appropriate sentence.','','','','','Do you know if the presentation materials are available online','','A biology seminar on Thursday was very informative.'],
  ['8','Build a Sentence','보통','1','01','','','','','','Make an appropriate sentence.','','','','','Do you know if the agenda has been sent out','','Are you attending the student council meeting tomorrow?'],
  ['9','Build a Sentence','보통','1','01','','','','','','Make an appropriate sentence.','','','','','Where can I buy a copy for myself?','','I just finished reading this fascinating book for class.'],
  ['10','Build a Sentence','보통','1','01','','','','','','Make an appropriate sentence.','','','','','Could you let me know if the trip is for business or leisure','','What places should I visit in New York during our semester break?'],
];
bsData.forEach(r => writingRows.push(makeRow(r)));

// Q11 Write an Email (Printer Malfunction)
writingRows.push(makeRow([
  '11','Write an Email','보통','1','01','',
  `To: Mr. Evans
Subject: Printer Malfunction Issues`,
  '','',
  `Write an email to the IT manager, Mr. Evans. In your email, do the following:
• Describe the issues you are experiencing with the printer.
• Explain how these issues are affecting your work.
• Suggest a possible solution to the problem.
Write as much as you can and in complete sentences.`,
  '','','','','','',
  'You are a student who works in the Office of Readmissions and have noticed that the office printer frequently malfunctions. You want to report this problem to the university\'s IT department and suggest a solution.'
]));

// Q12 Academic Discussion (Literature)
const adProfMsg = `Dr. Diaz: We've been discussing the role of literature in shaping societal values. Literature, which includes plays, poetry, and novels, can reflect and influence the beliefs and behaviors of a society. Some argue that literature is a powerful tool that can be used to inspire positive social change. But critics believe that literature's impact is limited compared to other forms of media. Do you think literature plays a significant role in shaping societal values? Why or why not?`;

const adStudentMsgs = `Andrew: Literature plays a significant role in shaping societal values because it gives people a unique opportunity to perceive and think about the feelings of others. Through storytelling it can inspire empathy and provoke critical thinking about social issues. Books have historically influenced movements and brought awareness to important causes.

Claire: While literature has some impact, other forms of media like television and social media are more influential in shaping societal values today. These platforms reach a broader audience and can quickly spread ideas and trends. Most people prefer these newer forms of media because they are less challenging than literary works are.`;

writingRows.push(makeRow([
  '12','Academic Discussion','보통','1','01','',
  adProfMsg + '\n\n' + adStudentMsgs,
  '','','',
  `Your professor is teaching a class on literature. Write a post responding to the professor's question.
In your response, you should do the following:
• Express and support your opinion.
• Make a contribution to the discussion in your own words.
An effective response will contain at least 100 words.`,
  '','','','','','',''
]));

fs.writeFileSync('csv_3.30_writing.csv', [writingHeader, ...writingRows].join('\n'), 'utf-8');
console.log('Created: csv_3.30_writing.csv (' + writingRows.length + ' rows)');
console.log('All CSV files created successfully!');
