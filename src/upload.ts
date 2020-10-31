export interface UploadArgs {
  multiple?: boolean;
  accept?: string;
}

let onFilesSelected = () => {};

const input = document.createElement('input');
input.type = 'file';
input.style.width = '0px';
input.style.height = '0px';
input.style.visibility = 'hidden';
input.addEventListener('change', () => {
  onFilesSelected();
});

export function uploadDialog(args: UploadArgs): Promise<Array<File>> {
  document.body.appendChild(input);
  return new Promise(resolve => {
    input.value = null;
    input.multiple = args.multiple;
    input.accept = args.accept || null;
    onFilesSelected = () => {
      let files = new Array<File>();
      const res = input.files || [];
      for (let n = 0; n < res.length; n++) {
        files.push(input.files.item(n));
      }
      document.body.removeChild(input);
      resolve(files);
    };
    input.click();
  });
}

export function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}
