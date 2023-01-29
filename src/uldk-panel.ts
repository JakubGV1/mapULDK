import "@vaadin/vaadin-button";
import "@vaadin/vaadin-combo-box";
import "@vaadin/vaadin-text-field";
import L from "leaflet";
import { css, html, LitElement } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import wellknown from "wellknown/wellknown.js";
import { getParcelInfoByTeryt } from "./ULDKApi";


interface uldkItem {
  name: string;
  teryt: string;
}
export let CurrentPanel = 'panel0';

@customElement("uldk-panel")
export class ULDKPanel extends LitElement {
  static styles = css`
    :host {
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 10px;
      background-color: white;
      width: 270px;
      min-height: 300px;
      overflow: auto;
    }

    vaadin-text-field {
      width: 100%;
    }

    vaadin-combo-box {
      width: 100%;
    }
  `;

  @property({ type: Object }) map?: L.Map;
  @property({type: Object}) geojsonLayer?: any;
  
  //@state() geojsonLayer: any = undefined;

  @state() search_types_by_option = {
    Wojewodztwo: {
      param: "GetVoivodeshipById",
      result: "voivodeship",
    },
    Powiat: {
      param: "GetCountyById",
      result: "county",
    },
    Gmina: {
      param: "GetCommuneById",
      result: "commune",
    },
    Region: {
      param: "GetRegionById",
      result: "region",
    },
    Dzialka: {
      param: "GetParcelById",
      result: "geom_wkt",
    },
  };


  
  wktToGeoJSON(wkt: string): GeoJSON.GeometryObject {
    return wellknown(wkt);
  }

  @query("#voivodeship")
  voivodeshipNode: any;

  @query("#county")
  countyNode: any;

  @query("#commune")
  communeNode: any;

  @query("#region")
  regionNode: any;

  @query("#parcel")
  parcelNode: any;

  @query("#terytnumber")
  terytNode:any;

  @property({type:Boolean})
  private _hidden = true;


  async firstUpdated(props: any) {
    super.firstUpdated(props);
    await new Promise((r) => setTimeout(r, 0));
  }

  async getAdministrativeNames(type: string, teryt: string = "") {
    const url = `https://uldk.gugik.gov.pl/?request=${this.search_types_by_option[type].param}&result=teryt,${this.search_types_by_option[type].result}&id=${teryt}`;
    const text = await fetch(url).then((r) => r.text());
    const result = text.substring(1).trim();
    const arr = result.split("\n");

    let items: uldkItem[] = [];

    arr.forEach((item) => {
      const itemSplit = item.split("|");
      items.push({ name: itemSplit[1], teryt: itemSplit[0] });
    });
    return items;
  }

  async getParcelById(type: string, teryt: string = "") {
    if (!this.geojsonLayer) {
      this.geojsonLayer = L.geoJSON(undefined, {
        onEachFeature: function(feature, layer) {
          layer.bindPopup(feature.properties.popupContent)
        }
      }).addTo(this.map!);
    }

    const url = `https://uldk.gugik.gov.pl/?request=${this.search_types_by_option[type].param}&result=${this.search_types_by_option[type].result}&id=${teryt}&srid=4326`;
    const text = await fetch(url).then((r) => r.text());
    const result = text.substring(1).trim();
    const wkt = (result.includes(";") ? result.split(";")[1] : result)
      ?.trim()
      .split("\n")[0];


    let parcel_info: string[] = await getParcelInfoByTeryt(teryt);
    const wktJSON = this.wktToGeoJSON(wkt);
    const dataJSON = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: wktJSON,
          properties: {
            popupContent: `<b>Województwo</b>: ${parcel_info[0]} <br>
            <b>Powiat</b>: ${parcel_info[1]}<br>
            <b>Gmina</b>: ${parcel_info[2]}<br>
            <b>Miejscowość</b>: ${parcel_info[2]}<br>
            <b>Indetyfikator działki</b>: ${teryt}<br>
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

  @property({type: String})
  activePanel = 'panel0';

  SearchSwitch(){
    this.activePanel = 'panel1';
    CurrentPanel = 'panel1';
  }
  ClickSwitch(){
    this.activePanel = 'panel2';
    CurrentPanel = 'panel2';
  }
  TerytSwitch(){
    this.activePanel = 'panel3';
    CurrentPanel = 'panel3';
  }

  render() {
    return html`
    <vaadin-button
      @click=${() => {
          this.TerytSwitch();
        }}>
    Przez Teryt</vaadin-button>

    <vaadin-button
      @click=${() => {
          this.ClickSwitch();
        }}>
    Przez Kliknięcie</vaadin-button>

    <vaadin-button
      @click=${() => {
          this.SearchSwitch();
        }}>
    Wyszukanie</vaadin-button>

    <div id="Panel-0" ?hidden="${this.activePanel !== 'panel0'}">
    <h4>Wybierz metodę wyszukiwania</h4>
    </div>


    <div id="Panel-1" ?hidden="${this.activePanel !== 'panel1'}">
      <h4>Pobieranie działek</h4>
      <vaadin-combo-box
        id="voivodeship"
        item-label-path="name"
        item-value-path="teryt"
        clear-button-visible
        label="Wybierz województwo"
        @selected-item-changed=${(e) => {
          this.countyNode.value = "";
          this.countyNode.items = [];
          this.countyNode.selectedItem = undefined;
        }}
        .dataProvider=${async (params, callback) => {
          let { filter } = params;
          let data = await this.getAdministrativeNames("Wojewodztwo");
          callback(data, data.length);
        }}
        @change=${async (e) => {
          this.countyNode.items = await this.getAdministrativeNames(
            "Powiat",
            e.target.value
          );
        }}
        }
      ></vaadin-combo-box>
      <vaadin-combo-box
        id="county"
        item-label-path="name"
        item-value-path="teryt"
        clear-button-visible
        label="Wybierz powiat"
        @selected-item-changed=${(e) => {
          this.communeNode.value = "";
          this.communeNode.items = [];
          this.communeNode.selectedItem = undefined;
        }}
        @change=${async (e) => {
          this.communeNode.items = await this.getAdministrativeNames(
            "Gmina",
            e.target.value
          );
        }}
        }
      ></vaadin-combo-box>
      <vaadin-combo-box
        id="commune"
        item-label-path="name"
        item-value-path="teryt"
        clear-button-visible
        label="Wybierz gminę"
        @selected-item-changed=${(e) => {
          this.regionNode.value = "";
          this.regionNode.items = [];
          this.regionNode.selectedItem = undefined;
        }}
        @change=${async (e) => {
          this.regionNode.items = await this.getAdministrativeNames(
            "Region",
            e.target.value
          );
        }}
      ></vaadin-combo-box>
      <vaadin-combo-box
        id="region"
        item-label-path="name"
        item-value-path="teryt"
        clear-button-visible
        label="Wybierz region"
      ></vaadin-combo-box>
      <vaadin-text-field
        id="parcel"
        label="Podaj nr działki"
      ></vaadin-text-field>
      <vaadin-button
        @click=${async (e) => {
          const teryt = `${this.regionNode.value}.${this.parcelNode.value}`;
          await this.getParcelById("Dzialka", teryt);
        }}
        >Szukaj w ULDK</vaadin-button
      >
      </div>

      <div id="Panel-2" ?hidden="${this.activePanel !== 'panel2'}">
      <h4>Kliknij na mapę aby uzyskać informację o działce</h4>
      </div>

      <div id="Panel-3" ?hidden="${this.activePanel !== 'panel3'}">
      <vaadin-text-field
        id="terytnumber"
        label="Podaj teryt"
      ></vaadin-text-field>
      <vaadin-button
        @click=${async (e) => {
          const teryt = `${this.terytNode.value}`;
          await this.getParcelById("Dzialka", teryt);
        }}
        >Szukaj w ULDK</vaadin-button
      >
      </div>
    `;
  }
}
