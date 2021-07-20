import React, { Component } from "react";
import {SkyLightStateless} from 'react-skylight';

import './global.css'

import {
  BrowserMultiFormatReader,
  NotFoundException,
  ChecksumException,
  FormatException,
} from '@zxing/library';


/**
 * Creates a QR scanner plugin which will actively scan for QR codes and use graphQL to insert into a DB
 */
class QRScanner extends Component {

    constructor(props){
        super(props)
        this.state = {
            selectedDeviceId: '',
            code: 'No result',
            videoInputDevices: [],
            isPopup: false,
            codeReader: new BrowserMultiFormatReader(),
            isCameraDetected: false,
            deviceNumber: 0
        }
        this.setupDevices = this.setupDevices.bind(this);
        this.resetClick = this.resetClick.bind(this);
        this.decodeContinuously = this.decodeContinuously.bind(this);
        this.resetPopup = this.resetPopup.bind(this);
        this.startScanning = this.startScanning.bind(this);
        this.startClick = this.startClick.bind(this);
        this.changeDevice = this.changeDevice.bind(this);
        
        //const codeReader = new BrowserMultiFormatReader();
    }

    componentDidMount() {
        this.state.codeReader
        .listVideoInputDevices()
        .then((videoInputDevices) => {
            this.setupDevices(videoInputDevices);
            this.startScanning(this.state.selectedDeviceId);
        })
        .catch((err) => {
            console.error(err);
        });
    }

    /**
     * Starts the scanning process. First it resets the video/scanner, then it sets the device state from the prop and then starts the decode process
     * @param {*} device 
     */
    startScanning(device) {
        this.state.codeReader.reset();
        this.setState({selectedDeviceId: device});
        this.decodeContinuously(device);
    }
    
    componentWillUnmount() {
        this.state.codeReader.reset();
    }

    /**
     * Resets the decode process
     */
    resetClick() {
        this.state.codeReader.reset();
        this.setState({code: 'Stopped Decode'})
    }

    /**
     * Resets the popup state
     */
    resetPopup() {
        this.setState({isPopup: false});
        this.setState({code: 'No result'});
    }

    /**
     * Starts the decode process
     */
    startClick() {
        this.state.codeReader.reset();
        this.setState({code: 'No result'});
        this.decodeContinuously(this.state.selectedDeviceId);
    }

    /**
     * Sets up the available video/camera devices. Checks for a back camera and assigns as the default if found otherwise
     * it will default to camera 2 in a multi camera setup or camera 1 on a single camera setup
     * @param {*} videoInputDevices is a list of devices from the machine
     */
    setupDevices(videoInputDevices) {

        // setup devices dropdown
        if (videoInputDevices.length > 1) {
            //setVideoInputDevices(videoInputDevices); videoInputDevices[1].deviceId
            let defaultNumber = 1;

            //cycle through devices and find back camera if possible
            let counter = 0;
            videoInputDevices.forEach(device =>{
                if(device.label.includes('back')){
                    defaultNumber = counter;
                }
                counter++;
            })
            this.setState({selectedDeviceId: videoInputDevices[defaultNumber].deviceId})
            this.setState({videoInputDevices: videoInputDevices})
            this.setState({deviceNumber: defaultNumber});
        } else{
            this.setState({selectedDeviceId: ''})
            this.setState({videoInputDevices: videoInputDevices})
        }
    }

    /**
     * Cycles through the available cameras and sets accordingly 
     */
    changeDevice(){
        
        if((this.state.deviceNumber + 1) < this.state.videoInputDevices.length && this.state.videoInputDevices.length != 1){
            let newDevice = this.state.deviceNumber + 1;
            
            this.setState({deviceNumber: newDevice});
            this.startScanning(this.state.videoInputDevices[newDevice].deviceId);
        } 
        else{
            this.setState({deviceNumber: 0});
            this.startScanning(this.state.videoInputDevices[0].deviceId);
        }
    }

    /**
     * Starts decode process by running the browser reader QR video decode. Runs async. If a code is found when scanning it will
     * pass the result and verify that it is a correct QR code via graphQL. If so it will insert a value using the user AUTH attribute
     * into the DB via graphQL
     * @param {*} selectedDeviceId is the deviceID to use for decode process
     */
    decodeContinuously(selectedDeviceId) {
        
        this.state.codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          'video',
          async (result, err) => {
            //console.log(await this.state.codeReader.listVideoInputDevices());
            //let code = await this.state.codeReader.listVideoInputDevices();
            //console.log(code[0].label +" "+code[1].label);
            //this.setState({code: code[0].label +" "+code[1].label});
            //this.setState({isPopup: true});
              //check for undefined camera - iOS
            if(typeof(selectedDeviceId) === 'undefined'){
                this.state.codeReader
                .listVideoInputDevices()
                .then((videoInputDevices) => {
                    this.setupDevices(videoInputDevices);
                    this.startScanning(this.state.selectedDeviceId);
                })
                .catch((err) => {
                    console.error(err);
                });
            }
            
            //if there is result AND the popup not active
            if (result && !this.state.isPopup) {
                // properly decoded qr code
                console.log('Found QR code!', result);
                this.setState({isPopup: true});
                this.setState({code: "Found QR code:"+result});
            }
    
            if (err) {
    
              if (err instanceof NotFoundException) {
                //console.log('No QR code found.');
              }
    
              if (err instanceof ChecksumException) {
                console.log("A code was found, but it's read value was not valid.");
              }
              
              if (err instanceof FormatException) {
                console.log('A code was found, but it was in a invalid format.');
              }
            }
          }
        );
      }//<video id="video" playsinline="true" style={{display: block}}/>
    
    render() {

                var myDialog = {
                    backgroundColor: '#3399ff',
                    color: '#ffffff',
                    width: '50%',
                    height: '10%',
                    borderRadius: '8px',
                    minHeight: '200px',
                    fontFamily: 'Open Sans', 
                  };

        return (
            <main className="wrapper">
            <section className="container" id="demo-content">
                
                <div className="menu" style={{width: "100%", top: "20%", backgroundColor: "transparent"}} >
                    <div className="menuFlex">
                        <div className="menuItem">
                            <div className="videoContainer">
                                <div className="scanOverlay">
                                    <video id="video" autoPlay/>
                                </div>
                            </div>
                        </div>
                        <div className="menuItem">
                            <p />
                            <button className="cameraButton" onClick={this.changeDevice}>Change Camera</button>
                        </div>
                    </div>
                </div>
                

                <div>
                <SkyLightStateless
                    isVisible={this.state.isPopup}
                    dialogStyles={myDialog}
                    onCloseClicked={() => this.resetPopup()}
                    title="QR CODE RESULT">
                    {this.state.code}
                    </SkyLightStateless>
                </div>
            </section>
            </main>
        );
    }
}

export default QRScanner