#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define RED_LED 7
#define GREEN_LED 8
#define BUZZER 9

LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
    pinMode(RED_LED, OUTPUT);
    pinMode(GREEN_LED, OUTPUT);
    pinMode(BUZZER, OUTPUT);
    lcd.init();
    lcd.backlight();
    Serial.begin(9600);
    resetDisplay();
}

void loop() {
    if (Serial.available()) {
        String command = Serial.readStringUntil('\n'); // Read incoming data
        command.trim();
        
        int commaIndex = command.indexOf(',');
        if (commaIndex != -1) {
            String action = command.substring(0, commaIndex);
            String patient = command.substring(commaIndex + 1);
            
            if (action == "START") {
                startProcess(patient);
            } else if (action == "STOP") {
                resetDisplay();
            }
        }
    }
}

void startProcess(String patient) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("NOW SERVING");
    lcd.setCursor(0, 1);
    lcd.print(patient);
    
    digitalWrite(RED_LED, HIGH);
    digitalWrite(BUZZER, HIGH);
    delay(1000);
    digitalWrite(GREEN_LED, HIGH);
    digitalWrite(RED_LED, LOW);
    digitalWrite(BUZZER, LOW);
}

void resetDisplay() {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("NO PATIENT");
    lcd.setCursor(0, 1);
    lcd.print("ON QUEUE");
    
    digitalWrite(GREEN_LED, LOW);
    digitalWrite(BUZZER, HIGH);
    digitalWrite(RED_LED, HIGH);
    delay(1000);
    digitalWrite(BUZZER, LOW);
    delay(1000);

}
