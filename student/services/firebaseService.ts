import { initializeApp } from "firebase/app";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import { FIREBASE_CONFIG, LECTURES_PATH } from '../constants';
import { Lecture, Grade } from '../types';

const app = initializeApp(FIREBASE_CONFIG);
const storage = getStorage(app);

const lecturesRef = ref(storage, LECTURES_PATH);

const formatTitle = (name: string): string => {
  const dotIndex = name.lastIndexOf('.');
  const basename = dotIndex > 0 ? name.substring(0, dotIndex) : name;
  
  if (basename.startsWith('.')) return '';

  return basename
    .replace(/[_-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const listGrades = async (): Promise<Grade[]> => {
  try {
    const rootRes = await listAll(lecturesRef);
    const grades: Grade[] = rootRes.prefixes.map((gradeFolderRef) => {
      const folderName = gradeFolderRef.name;
      return {
        id: folderName,
        name: formatTitle(folderName),
      };
    });
    return grades.filter(g => g.name).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  } catch (error) {
    console.error("Error fetching grades:", error);
    throw error;
  }
};

export const listLecturesByGrade = async (gradeFolder: string): Promise<Lecture[]> => {
    try {
        const gradeFolderRef = ref(storage, `${LECTURES_PATH}/${gradeFolder}`);
        const gradeRes = await listAll(gradeFolderRef);

        const lecturePromises = gradeRes.items.map(async (itemRef) => {
            const url = await getDownloadURL(itemRef);
            const lectureTitle = formatTitle(itemRef.name);

            if (!lectureTitle) return null;

            return {
                id: itemRef.fullPath,
                title: lectureTitle,
                url: url,
            };
        });

        const lectures = await Promise.all(lecturePromises);
        return lectures.filter((lecture): lecture is Lecture => lecture !== null).sort((a, b) => a.title.localeCompare(b.title));
    } catch (error) {
        console.error(`Error fetching lectures for grade ${gradeFolder}:`, error);
        throw error;
    }
};
