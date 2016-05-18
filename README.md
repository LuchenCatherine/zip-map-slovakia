# Map of ZIP codes
Interactive map of ZIP codes of cities in Slovakia; <br/>
inspired by the book Visualizing data by Ben Fry. 

## About
The visualization helps to analyze the system of ZIP codes of Slovakia (or in Slovak, PSČ - Poštovné smerovacie číslo).

When interacting with the visualization, you can find the answers to the following questions:
 * Is there any pattern in the ZIP code system?
 * Where is a particular ZIP code and to what city it belongs to?
 * What is the population of a given city with given ZIP code?

## Implementation
Data for this visualization was extracted from Wikipedia's list of municipalities and towns in Slovakia.
JavaScript + D3.js

## Options
The visualization is updated according to three inputs:
 * Number input - ZIP code made out of five digits (starting by 0, 9 or 8)
 * Population - choice for scaling a circle representing a city according to its population
 * Color of the next number - choice for matching the next number of a ZIP code to a color to see if there is any particular logic of ZIP code numbers 
