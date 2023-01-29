import wellknown from "wellknown/wellknown.js";


export interface uldkClick {
    geometry: GeoJSON.Geometry;
    teryt: string;
  }

export const SearchByClick = async(position:any) => {
    const url = `https://uldk.gugik.gov.pl/?request=GetParcelByXY&result=teryt&xy=${position.lng},${position.lat},4326`;
    const text = await fetch(url).then((r) => r.text());
    const result = text.substring(1).trim();
    return await getParcelByClick(result);
}

export const getParcelByClick= async(link: string)=>{
  const url = `https://uldk.gugik.gov.pl/?request=GetParcelById&result=teryt,geom_wkt&id=${link}&srid=4326`;
  
  const text = await fetch(url).then((r) => r.text());
  const result = text.substring(1).trim();
  const wkt = (result.includes(";") ? result.split(";")[1] : result)
    ?.trim()
    .split("\n")[0];

  const wktCheck = (wkt.includes("|") ? wkt.split("|")[1] : wkt);
  const wktJSON = wktToGeoJSON(wktCheck);
  let item: uldkClick = {geometry: wktJSON, teryt: text.substring(1).trim().split("|")[0]};
  return item;
}

export const getParcelInfoByTeryt = async (teryt: string = "") =>{
    const url = `https://uldk.gugik.gov.pl/?request=GetParcelByIdOrNr&id=${teryt}&result=wojewodztwo,powiat,gmina,region,numer`;
    const text = await fetch(url).then((r) => r.text());
    const result = text.substring(1).trim();
    const itemSplit = result.split("|");
    return itemSplit;
  }

const wktToGeoJSON = (wkt: string): GeoJSON.GeometryObject => {
    return wellknown(wkt);
  }

