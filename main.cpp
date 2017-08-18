#include "MicroBit.h"
MicroBit uBit;

#define EVENT_ID    8888

void onConnected(MicroBitEvent) {
  //uBit.display.print("C");
}

 
void onDisconnected(MicroBitEvent){
  //uBit.display.print("D");
}

void onButtonA(MicroBitEvent e) {
   MicroBitEvent evt(EVENT_ID, 18);
   uBit.display.scroll("x");
}



void onControllerEvent(MicroBitEvent e) {
  //uBit.display.print(e.value);
  uBit.io.P0.setAnalogValue(e.value);
  

}

int main() {
    uBit.init();
    uBit.display.scroll("DC");

    new MicroBitLEDService(*uBit.ble, uBit.display);
    new MicroBitAccelerometerService(*uBit.ble, uBit.accelerometer);
    new MicroBitButtonService(*uBit.ble);
    new MicroBitIOPinService(*uBit.ble, uBit.io);
    //new MicroBitMagnetometerService(*uBit.ble, uBit.compass); 
    new MicroBitTemperatureService(*uBit.ble, uBit.thermometer);
    

    uBit.messageBus.listen(MICROBIT_ID_BLE, MICROBIT_BLE_EVT_CONNECTED, onConnected);
    uBit.messageBus.listen(MICROBIT_ID_BLE, MICROBIT_BLE_EVT_DISCONNECTED, onDisconnected);
    uBit.messageBus.listen(MICROBIT_ID_BUTTON_A, MICROBIT_BUTTON_EVT_CLICK, onButtonA);
    uBit.messageBus.listen(EVENT_ID, MICROBIT_EVT_ANY, onControllerEvent);

    release_fiber();
}