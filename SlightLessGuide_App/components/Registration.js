import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ImageBackground,
  Image,
} from 'react-native';
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase({
  name: 'contSDB.db',
  location: 'default',
});

function Registration({navigation}) {
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS contacts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, contact_name TEXT, contact_number TEXT)',
        [],
        () => {
          console.log('Table created successfully!');
        },
        error => {
          console.error('Error creating table: ', error.message);
        },
      );
    });
  }, []);

  const saveContact = () => {
    if (contacts.length < 4 && contactName !== '' && contactNumber !== '') {
      setContacts([
        ...contacts,
        {name: contactName.toLowerCase(), number: contactNumber},
      ]);
      setContactName('');
      setContactNumber('');
    }
  };

  const saveToDatabase = () => {
    if (contacts.length === 0) {
      alert('Please enter contact information before saving.');
      return;
    }

    db.transaction(tx => {
      // Insert the new contacts
      contacts.forEach(contact => {
        tx.executeSql(
          'INSERT INTO contacts (name, contact_name, contact_number) VALUES (?, ?, ?)',
          [name, contact.name, contact.number],
          () => {
            console.log('Contact saved successfully!');
          },
          error => {
            console.error('Error saving contact: ', error.message);
          },
        );
      });

      // Delete older records to keep only the latest 4
      tx.executeSql(
        'DELETE FROM contacts WHERE id NOT IN (SELECT id FROM contacts ORDER BY id DESC LIMIT 4)',
        [],
        () => {
          // console.log('Older records deleted successfully!');
          navigation.navigate('Objectdetection');
        },
        error => {
          console.error('Error deleting older records: ', error.message);
        },
      );
    });
  };

  return (
    <ImageBackground
      source={require('./Images/RegMain.gif')}
      style={styles.background}>
      <View style={styles.container}>
        <Image
          source={require('./Images/RegLogo.png')} // Replace with your logo path
          style={styles.logo}
        />
        <Text style={styles.heading}>Registration</Text>

        <Text style={styles.label}>Add Contacts:</Text>
        <Text style={styles.contactsCounter}>{contacts.length} / 4</Text>

        <ScrollView style={styles.contactsContainer}>
          {contacts.map((item, index) => (
            <View key={index} style={styles.contactItem}>
              <Text style={styles.contactText}>
                {item.name}: {item.number}
              </Text>
            </View>
          ))}
        </ScrollView>

        <TextInput
          style={styles.input}
          placeholder="Contact Name"
          value={contactName}
          onChangeText={text => setContactName(text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Contact Number"
          value={contactNumber}
          onChangeText={text => setContactNumber(text)}
          keyboardType="phone-pad"
        />

        <TouchableOpacity style={styles.addButton} onPress={saveContact}>
          <Text style={styles.addButtonText}>Add Other Contact</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={saveToDatabase}>
          <Text style={styles.saveButtonText}>Finish and Save</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(240, 244, 248, 0.9)', // Slight transparency for 3D effect
    borderRadius: 20,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
  },
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    marginTop: 40,
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 5,
  },
  label: {
    width: '100%',
    fontSize: 18,
    color: 'black',
    marginTop: 10,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 2,
    borderColor: 'black',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginTop: 10,
    backgroundColor: 'transparent',
    color: 'black',
  },
  contactsCounter: {
    width: '100%',
    fontSize: 16,
    color: '#333',
    marginVertical: 10,
  },
  contactsContainer: {
    width: '100%',
    maxHeight: 100,
    marginBottom: 10,
  },
  contactItem: {
    padding: 10,
    backgroundColor: '#eaeaea',
    borderRadius: 8,
    marginTop: 5,
  },
  contactText: {
    fontSize: 16,
    color: '#333',
  },
  addButton: {
    width: '100%',
    backgroundColor: '#55AD9B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    width: '100%',
    backgroundColor: '#55AD9B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Registration;