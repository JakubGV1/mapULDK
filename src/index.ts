import L from "leaflet";
import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import {CurrentPanel} from "./uldk-panel"
import "./ULDKApi";
import { SearchByClick, uldkClick, getParcelInfoByTeryt } from "./ULDKApi";

@customElement("main-panel")
export class MainPanel extends LitElement {
  static styles = css``;

  @state() map?: L.Map;
  @state() geojsonLayer?: any = undefined;
  @state() basemap?: L.TileLayer = new L.TileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution: "OpenStreetMap",
    }
  );

  initMap() {
    this.map = new L.Map("map", {
      center: new L.LatLng(51.236525, 22.4998601),
      zoom: 18,
    });
  }

  async _handleClick(e) {
    if(CurrentPanel=='panel2'){
      const info = await SearchByClick(e.latlng);
      this.DisplaySearch(info);
    }
}

async DisplaySearch(info: uldkClick){
  if (!this.geojsonLayer) {
    this.geojsonLayer = L.geoJSON(undefined, {
      onEachFeature: function(feature, layer) {
        layer.bindPopup(feature.properties.popupContent)
      }
    }).addTo(this.map!);
  }
  let parcel_info: string[] = await getParcelInfoByTeryt(info.teryt);
  const dataJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: info.geometry,
      properties: {
        popupContent: `<b>Województwo</b>: ${parcel_info[0]} <br>
        <b>Powiat</b>: ${parcel_info[1]}<br>
        <b>Gmina</b>: ${parcel_info[2]}<br>
        <b>Miejscowość</b>: ${parcel_info[2]}<br>
        <b>Indetyfikator działki</b>: ${info.teryt}<br>
        <b>Numer działki</b>: ${parcel_info[4]}<br>
        `
      },
      id: 1,
    },
  ],
};

 this.geojsonLayer.clearLayers();
 this.geojsonLayer.addData(dataJSON);
 this.map?.fitBounds(this.geojsonLayer.getBounds(), {})
}

  firstUpdated(props: any) {
    super.firstUpdated(props);
    this.initMap();
    this.basemap?.addTo(this.map!);
    this.map?.on('click', async e => await this._handleClick(e));
  }

  render() {
    return html`<uldk-panel .map=${this.map} .geojsonLayer=${this.geojsonLayer}></uldk-panel>`;
  }
}


