const skills={
  bto:['conditional-process','Revealed outcomes and hidden sources','Use the report to update the sample space or infer which source produced the outcome.'],
  nl:['numerical-data','Applied numerical reasoning','Translate totals, rates and percentage changes into an equation with units.'],
  ll:['ranking-models','Compare sampling procedures','Identify the denominator, sampling unit and weights before ranking.'],
  iv:['reference-estimates','Scale and uncertainty','Estimate an unknown reference quantity, scale it, then allow room for uncertainty.'],
  ob:['market-consistency','Executable trades and consistent prices','Hedge the legs at executable prices or test whether all quotes admit consistent values.'],
};
export const scenarioCatalog=Object.fromEntries(Object.entries(skills).map(([section,[id,title,skill]])=>[section,{id,title,skill,levels:[1,2,3]}]));
export const NUMERICAL_SHARES={sequences:0,balanced:.35,broad:.65};
