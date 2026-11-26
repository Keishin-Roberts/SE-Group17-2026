// Turns the mood number (0-100) into a level. The badge colour and the face of
// Steve Jobs both use it, so they always match.
//   name:       used for data-mood on the body and for the file steve_jobs_<name>.svg
//   label:      shown in the badge
//   badgeClass: colour class of the badge in index.css
export function getMoodLevel(mood) {
    if (mood >= 80) {
        return { name: 'delighted', label: 'Delighted', badgeClass: 'mood-very-positive' }
    }
    if (mood >= 60) {
        return { name: 'happy', label: 'Happy', badgeClass: 'mood-positive' }
    }
    if (mood <= 25) {
        return { name: 'furious', label: 'Furious', badgeClass: 'mood-very-negative' }
    }
    if (mood < 50) {
        return { name: 'annoyed', label: 'Annoyed', badgeClass: 'mood-negative' }
    }
    return { name: 'calm', label: 'Calm', badgeClass: 'mood-neutral' }
}
