# Map of ZIP codes
Interactive map of ZIP codes of cities in Slovakia;
inspired by the book Visualizing data by Ben Fry.

## About
The visualization helps to analyze the system of ZIP codes of Slovakia (or in Slovak, PSČ - Poštovné smerovacie číslo)
which consist of five numbers.

When interacting with the visualization, you can find the answers to the following questions:
 * Is there any pattern in the ZIP code system?
 * Where is a particular ZIP code and to what city it belongs to?
 * What is the population of a given city with given ZIP code?

## Implementation
Data for this visualization was extracted from Wikipedia's list of municipalities and towns in Slovakia.

The code is written as single IIFE where data is extracted from CSV file, then visualized.
Pan & zoom is provided by D3. Custom tooltip displaying information about cities provided by D3-tip.
Vis is updated according to the number and checkbox inputs, see [Options](#options).

## Dependencies
* D3.js
* D3-tip.js

## Options
The visualization is updated according to three inputs:
 * Number input - ZIP code made out of five digits (starting by 0, 9 or 8)
 * Population - choice for scaling a circle representing a city according to its population
 * Color of the next number - choice for matching the next number of a ZIP code to a color to see if there is any particular logic of ZIP code numbers

## Life demo
<a href="http://lucyia.github.io/zip-map-slovakia/">Visualization of ZIP codes of Slovakia</a>

Demo:
![ZIP codes of Slovakia](https://github.com/lucyia/zip-map-slovakia/blob/master/img/zip_demo.gif)

First number coloured:
![ZIP codes of Slovakia - first number coloured](https://github.com/lucyia/zip-map-slovakia/blob/master/img/zip_first_number.png)

Second number coloured:
![ZIP codes of Slovakia - second number coloured](https://github.com/lucyia/zip-map-slovakia/blob/master/img/zip_second_number.png)

## Licence
MIT
