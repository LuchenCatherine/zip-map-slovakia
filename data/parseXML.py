#!/usr/bin/env python
#coding=utf-8

import urllib2
import xml.etree.ElementTree as ET
import re
import codecs
import time
import sys

print "Start."
print "1/4: Reading the file"

urlList = []

treeAll = ET.parse("zoznamAll.xml")
rootAll = treeAll.getroot()
for child in rootAll:
	if child.tag=="table":		
		for tr in child:
			td = tr[0]
			for a in td:				
				urlList.append(a.attrib.get("href"))	
				
treeBA = ET.parse("zoznamBA.xml")
rootBA = treeBA.getroot()
for child in rootBA:
	if child.tag=="table":		
		for tr in child:
			th = tr[0]
			if th.tag=="th":
				for a in th:				
					urlList.append(a.attrib.get("href"))	

treeKE = ET.parse("zoznamKE.xml")
rootKE = treeKE.getroot()
for child in rootKE:
	if child.tag=="table":		
		for tr in child:
			td = tr[0]
			for a in td:				
				urlList.append(a.attrib.get("href"))											

print "2/4: URL list created, number of webpages: %s" %len(urlList)

print "3/4: Downloading the info from webpages:"

cityList = []
nazov = unicode('Názov (miestny názov)', "utf-8")
kraj = unicode('Kraj, v ktorom {{{status}}} leží', "utf-8")
okres = unicode('Okes, v ktorom obec leží', "utf-8")
nadmorska_vyska = unicode('Nadmorská výška', "utf-8")
gps_suradnice = unicode('geo-dec', "utf-8")
rozloha = unicode('rozloha', "utf-8")
obyvatelstvo = unicode('Počet obyvateľov', "utf-8")
hustotaObyv = unicode('Hustota obyvateľov', "utf-8")
psc = unicode('PSČ', "utf-8")
suj = unicode('Identifikačný kód štatistickej územnej jednotky', "utf-8")
ecv = unicode('Evidenčné číslo vozidla', "utf-8")
tel = unicode('Telefónna predvoľba', "utf-8")

broken = 0
undefined = "---"

#urlList = []
#urlList.append("/wiki/Kov%C3%A1%C4%8Dov%C3%A1_(okres_Zvolen)")

#for city in urlList[::-1]:
for city in urlList: 
	#print "Downloading info about: "+city
		
	response = urllib2.urlopen('http://sk.wikipedia.org'+city)
	htmlPage = response.read()
	root = ET.fromstring(htmlPage)
	cityInfo = []

	# 0
	elemTitle = root.find(".//*[@title='"+nazov+"']")
	nameValue = undefined
	if elemTitle!=None:
		for tr in elemTitle:		
				nameValue = tr.text.strip()
	cityInfo.append(nameValue)			
	
	# 1
	elemKraj = root.find(".//*[@title='"+kraj+"']")
	krajValue = undefined
	if elemKraj!=None:
		for th_td in elemKraj:		
			if th_td.tag=="td" or th_td.tag=="tr":
				for span in th_td:
					for a in span:
						krajValue = a.text.strip()
	cityInfo.append(krajValue)	
	
	# 2				
	elemNadmVyska = root.find(".//*[@title='"+nadmorska_vyska+"']")
	vyskaValue = undefined
	if elemNadmVyska!=None:
		for th_td in elemNadmVyska:		
			if th_td.tag=="td":
				vyskaValue = th_td.text.strip()
	cityInfo.append(vyskaValue)	
	
	# 3
	elemGPS = root.find(".//*[@class='"+gps_suradnice+"']")
	gpsValue = undefined
	if elemGPS!=None:
		gpsValue = elemGPS.text.strip()
	cityInfo.append(gpsValue)
	
	# 4 (km^2)
	elemRozloha = root.find(".//*[@title='"+rozloha+"']")
	rozlohaValue = undefined
	if elemRozloha!=None:
		for th_td in elemRozloha:		
			if th_td.tag=="td":
				rozlohaValue = th_td.text.strip()
	cityInfo.append(rozlohaValue)		
		
	# 5 (obyv./km^2)
	elemObyvatelstvo = root.find(".//*[@title='"+obyvatelstvo+"']")
	obyvValue = undefined
	if elemObyvatelstvo!=None:
		for th_td in elemObyvatelstvo:		
			if th_td.tag=="td":
				obyvValue = th_td.text.strip()
	cityInfo.append(obyvValue)		
		
	# 6		
	elemHustotaObyv = root.find(".//*[@title='"+hustotaObyv+"']")
	hustotaValue = undefined
	if elemHustotaObyv!=None:
		for th_td in elemHustotaObyv:		
			if th_td.tag=="td":
				for span in th_td:				
					x = re.sub('\obyv./$', '', span.text)
					hustotaValue = x.strip()				
	cityInfo.append(hustotaValue)					
		
	# 7
	elemPSC = root.find(".//*[@title='"+psc+"']")
	pscValue = undefined
	if elemPSC!=None:
		for th_td in elemPSC:		
			if th_td.tag=="td":
				pscValue = th_td.text
				pscValue = pscValue.strip()	
				if u'(po\u0161ta' in pscValue:			
					pscValue = re.sub(u'\(po\u0161ta', '', pscValue)
					pscValue.strip()
	cityInfo.append(pscValue)				

	# 8			
	elemSUJ = root.find(".//*[@title='"+suj+"']")
	sujValue = undefined
	if elemSUJ!=None:
		for th_td in elemSUJ:		
			if th_td.tag=="td":
				sujValue = th_td.text.strip()			
	cityInfo.append(sujValue)		
		
	# 9
	elemECV = root.find(".//*[@title='"+ecv+"']")
	ecvValue = undefined
	if elemECV!=None:
		for th_td in elemECV:		
			if th_td.tag=="td":
				ecvValue = th_td.text.strip()				
	cityInfo.append(ecvValue)		
	
	# 10		
	elemTEL = root.find(".//*[@title='"+tel+"']")
	telValue = undefined
	if elemTEL!=None:
		for th_td in elemTEL:		
			if th_td.tag=="td":
				telValue = th_td.text.strip()
	cityInfo.append(telValue)			
			
	brokenInfo = False
	atLeastOneDefined = False	
	for info in cityInfo:
		if info==undefined:			
			brokenInfo = True			
		else:
			atLeastOneDefined = True
	
	if atLeastOneDefined:
		cityList.append(cityInfo)		
		
	if brokenInfo:
		broken += 1		
	
	if (len(cityList)%100 == 0):		
		cityListLen = str(len(cityList))
		sys.stdout.write("    "+cityListLen+"...")
		sys.stdout.flush()
		time.sleep(2)

print "\n3/4: Downloaded, cities with at least one column missing: %s" %broken


print "4/4: Writing into a file"

file2write = codecs.open("SlovakiaCitiesInfo", encoding='utf-8', mode='w')
file2write.write("Meno"+"\t"+"Kraj"+"\t"+"Nadm.vyska (m.n.m.)"+"\t"+"GPS"+"\t"+"Rozloha (km2)"+"\t"+"Obyvatelstvo"+"\t"+"Hustota obyv. (obyv./km2)"+"\t"+"PSC"+"\t"+"SUJ"+"\t"+"ECV"+"\t"+"TEL\n")

for city in cityList:
	file2write.write('%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t\n' %(city[0], city[1], city[2], city[3], city[4], city[5], city[6], city[7], city[8], city[9], city[10]))	
file2write.close()


print "Done."
