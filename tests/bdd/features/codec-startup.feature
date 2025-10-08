Feature: MGS2 Codec Interface Startup
  As a user interested in MGS2 nostalgia and intellectual sparring
  I want to activate the codec interface seamlessly
  So that I can engage with Colonel AI personalities

  Background:
    Given the user navigates to the codec interface
    And the system loads successfully

  Scenario: User encounters the codec standby screen
    When the interface loads
    Then the user should see "TAP TO REACTIVATE CODEC" message
    And the frequency indicator "140.85" should be visible
    And the classic MGS scanline effects should be displayed

  Scenario: User activates the codec interface
    When the user clicks "TAP TO REACTIVATE CODEC"
    Then the codec startup sound should play
    And the main codec interface should become visible
    And the user should see both "COLONEL" and "USER" portraits
    And the control buttons should be accessible

  Scenario: User interacts with codec controls after activation
    Given the codec interface is activated
    When the user clicks the "THEME:" button
    Then the theme should cycle to a different color
    And the button text should reflect the new theme
    When the user clicks the "MODE:" button  
    Then the AI mode should cycle to a different personality
    And the button text should reflect the new mode

  Scenario: User engages in conversation with Colonel AI
    Given the codec interface is activated
    When the user types "Hello, Colonel AI!" in the input field
    And the user presses Enter
    Then the message should appear as "USER: Hello, Colonel AI!" in the subtitle stream
    And the Colonel AI should respond with authentic MGS2 personality
    And the response should be tagged with the current mode

  Scenario: User tests different AI personalities
    Given the codec interface is activated
    When the user switches to "BTC [Orange Pill]" mode
    Then the theme should automatically switch to orange
    And the theme cycling button should be disabled
    When the user asks about Bitcoin
    Then the Colonel AI should respond with Bitcoin-focused guidance
    And the response should maintain the condescending Colonel AI tone

  Scenario: User experiences responsive design
    Given the user is on a mobile device
    When the codec interface loads
    Then the interface should adapt to the smaller viewport
    And all controls should remain accessible
    When the user activates the codec
    Then the portraits and input should be properly scaled
    And the conversation functionality should work normally

  Scenario: User encounters error handling
    Given the codec interface is activated
    When the user attempts to send an extremely long message
    Then the system should validate the input length
    And provide helpful feedback about the character limit
    When the user attempts prompt injection
    Then the system should block the malicious input
    And display a safe error message

  Scenario: User benefits from accessibility features
    Given the codec interface is activated
    When the user navigates using keyboard only
    Then all interactive elements should be focusable
    And the tab order should be logical
    When the user uses a screen reader
    Then all UI elements should have appropriate labels
    And the codec conversation should be accessible
