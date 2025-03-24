import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, Image, Text, ActivityIndicator, Modal, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import WebView from 'react-native-webview';

const App = () => {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState(null);
  const [downloadLinks, setDownloadLinks] = useState([]);

 
  const API_KEY ';

  const searchMovies = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${query}`
      );
      const data = await response.json();
      if (data.results) {
        setMovies(data.results);
        setError('');
      }
    } catch (err) {
      setError('Failed to fetch movies');
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularMovies = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`
      );
      const data = await response.json();
      if (data.results) {
        setMovies(data.results);
        setError('');
      }
    } catch (err) {
      setError('Failed to fetch popular movies');
    } finally {
      setLoading(false);
    }
  };

  const fetchMovieDetails = async (movieId) => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&append_to_response=videos,watch/providers`
      );
      const data = await response.json();
      
      // Find trailer
      const trailer = data.videos?.results?.find(vid => vid.type === 'Trailer');
      setTrailerUrl(trailer?.key);
      
      // Get streaming providers
      setDownloadLinks(data['watch/providers']?.results?.US?.flatrate || []);
      
    } catch (err) {
      console.error('Error fetching details:', err);
    }
  };

  const openMovieModal = async (movie) => {
    setSelectedMovie(movie);
    setModalVisible(true);
    await fetchMovieDetails(movie.id);
  };

  const renderMovieItem = ({ item }) => (
    <TouchableOpacity style={styles.movieItem} onPress={() => openMovieModal(item)}>
      <Image
        source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
        style={styles.poster}
        defaultSource={require('./assets/icon.png')}
      />
      <View style={styles.movieInfo}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.year}>
          {item.release_date ? new Date(item.release_date).getFullYear() : 'Unknown year'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderTrailerSection = () => {
    if (!trailerUrl) return <Text style={styles.noTrailer}>No trailer available</Text>;
    
    return (
      <View style={styles.trailerContainer}>
        <WebView
          style={styles.trailerVideo}
          javaScriptEnabled={true}
          source={{ uri: `https://www.youtube.com/embed/${trailerUrl}` }}
        />
        <Button
          title="Watch Full Trailer on YouTube"
          onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${trailerUrl}`)}
        />
      </View>
    );
  };

  const renderDownloadOptions = () => {
    if (downloadLinks.length === 0) return null;
    
    return (
      <View style={styles.downloadSection}>
        <Text style={styles.sectionTitle}>Available On:</Text>
        {downloadLinks.map(service => (
          <TouchableOpacity
            key={service.provider_id}
            style={styles.serviceButton}
            onPress={() => Linking.openURL(`https://www.themoviedb.org/movie/${selectedMovie.id}/watch`)}
          >
            <Image
              source={{ uri: `https://image.tmdb.org/t/p/w200${service.logo_path}` }}
              style={styles.serviceLogo}
            />
            <Text style={styles.serviceName}>{service.provider_name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search for movies..."
        value={query}
        onChangeText={setQuery}
      />
      <View style={styles.buttonContainer}>
        <Button title="Search Movies" onPress={searchMovies} />
        <Button title="Popular Movies" onPress={fetchPopularMovies} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={movies}
          renderItem={renderMovieItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={<Text style={styles.empty}>No movies found</Text>}
        />
      )}

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {selectedMovie && (
            <>
              <Image
                source={{ uri: `https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}` }}
                style={styles.modalPoster}
              />
              <Text style={styles.modalTitle}>{selectedMovie.title}</Text>
              {renderTrailerSection()}
              {renderDownloadOptions()}
              <Text style={styles.modalOverview}>{selectedMovie.overview}</Text>
              <Text style={styles.modalRating}>
                Rating: {selectedMovie.vote_average}/10
              </Text>
              <Text style={styles.modalDate}>
                Release Date: {selectedMovie.release_date}
              </Text>
              <Text style={styles.disclaimer}>
                This app does not support piracy. Please use official streaming services.
              </Text>
              <Button title="Close" onPress={() => setModalVisible(false)} />
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  input: {
    height: 50,
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  movieItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  poster: {
    width: 100,
    height: 150,
    borderRadius: 8,
  },
  movieInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  year: {
    fontSize: 14,
    color: '#6c757d',
  },
  error: {
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 20,
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: '#6c757d',
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  modalPoster: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 15,
  },
  modalOverview: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
  },
  modalRating: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalDate: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 20,
  },
  trailerContainer: {
    marginVertical: 15,
    height: 200,
  },
  trailerVideo: {
    flex: 1,
  },
  downloadSection: {
    marginTop: 10,
  },
  serviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginVertical: 5,
  },
  serviceLogo: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  serviceName: {
    fontSize: 16,
  },
  disclaimer: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 10,
  },
  noTrailer: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default App;
