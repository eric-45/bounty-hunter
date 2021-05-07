import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Plugins } from '@capacitor/core';
import { Router } from '@angular/router'
import { Loader } from "@googlemaps/js-api-loader"
import { api_key } from './google_maps_api_key.js'

const { Geolocation } = Plugins;

declare var google

@Component({
  selector: 'app-bounty-active',
  templateUrl: './bounty-active.page.html',
  styleUrls: ['./bounty-active.page.scss'],
})
export class BountyActivePage implements OnInit {
  // this is essentially Angular's version of document.getElementById
  @ViewChild('mapCanvas', { static: true }) mapElement: ElementRef;

  public map: any 

  public userLocation: any
  public bountyLocation: any = { 
    latitude: 41.4346987938767,
    longitude: -96.49720955969869
  }
  private watcherId: string;
  private userRawPosition: any = {
    coords: {}
  }
  private userMarker: any;
  private bountyCircle: any;
  private userLocationObject;

  constructor(private router: Router) { }

  ngOnInit() {
    const loader = new Loader({
      apiKey: api_key,
      version: "weekly",
      libraries: ['geometry'],
    });

    loader.load().then( () => {
      this.loadMap()
    }).then( () => {
      this.watchLocation();
    })

  }

  loadMap() {

    return Geolocation.getCurrentPosition().then(position => {


      const userLocationObject = new google.maps.LatLng(position.coords.latitude, position.coords.longitude)

      const mapOptions = {
        zoom: 13,
        center: userLocationObject
      }

      this.map = new google.maps.Map(
        this.mapElement.nativeElement, // element on the page
        mapOptions // customization options
    )

      return Promise.resolve()
    })
  }

  watchLocation() {
    console.log('Watching location');

    const positionOptions = {
      maximumAge: 0,
      enableHighAccuracy: false
    }

    this.watcherId = Geolocation.watchPosition(positionOptions, (position) => {

      console.log('Got watched position', position);

      if(
        !position ||
        !position.coords ||
        (this.userRawPosition.coords.latitude === position.coords.latitude &&
        this.userRawPosition.coords.longitude === position.coords.longitude)
      ) {
        console.log('Same location, skipping rest of function', this.userRawPosition, position);
        return false;
      }

      this.userRawPosition = position;

      console.log("Position: ", position);

      this.updateUserLocation();
      this.updateBountyCircle();

    })

  }

  updateUserLocation() {
    this.userLocationObject = new google.maps.LatLng(
      this.userRawPosition.coords.latitude,
      this.userRawPosition.coords.longitude
    )

    if(this.userMarker) this.userMarker.setMap(null);
    this.userMarker = new google.maps.Marker({
      map: this.map,
      position: this.userLocationObject,
      animation: google.maps.Animation.DROP 
    })
  }

  updateBountyCircle() {
    const bountyLocationObject = new google.maps.LatLng(this.bountyLocation.latitude, this.bountyLocation.longitude)

    const distanceToBounty = Math.round(
      google.maps.geometry.spherical.computeDistanceBetween(this.userLocationObject, bountyLocationObject)
    )

    console.log('Distance to the bounty:', distanceToBounty);

    let radius
    if (distanceToBounty > 1000) {
      radius = 500
    } else if (distanceToBounty <= 1000 && distanceToBounty > 500) {
      radius = 300
    } else if (distanceToBounty <= 500 && distanceToBounty > 100) {
      radius = 100
    } else {
      radius = 25
    }

    if(this.bountyCircle) this.bountyCircle.setMap(null);

    this.bountyCircle = new google.maps.Circle({
      strokeColor: "#FF0000",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#FF0000",
      fillOpacity: 0.35,
      map: this.map,
      center: bountyLocationObject,
      radius
    });
  }

  goToBountyClaim() {
     this.router.navigateByUrl('/bounty-claim');   
  }
}
