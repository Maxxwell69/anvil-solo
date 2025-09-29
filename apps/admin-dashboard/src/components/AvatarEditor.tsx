import React from "react";
import styled from "styled-components";
import ReactAvatarEditor from "react-avatar-editor";

const AvatarEditor = ({ image, onClose, onSubmit, width, height, borderRadius }: { image: string, onClose: () => void, onSubmit: (image: string) => void, width?: string, height?: string, borderRadius?: number }) => {

  const cropRef = React.useRef<any>(null);
  const [scale, setScale] = React.useState(10);

  const submit = () => {
    if (cropRef.current) {
      const dataUrl = cropRef.current.getImage().toDataURL('image/webp');
      onSubmit(dataUrl);
    }
  }

  return (
    <StyledModal width={width} height={height}>
      <div className="box">
        <ReactAvatarEditor
          ref={cropRef}
          image={image}
          style={{ width: width || "100%", height: height || "100%", aspectRatio: '1.5/1', borderRadius: '4px' }}
          border={4}
          borderRadius={borderRadius || 10}
          color={[0, 0, 0, 0.8]}
          scale={scale / 10}
          rotate={0}
        />
      </div>
      {/* <input type="range" min="10" max="30" value={scale} onChange={e => setScale(Number(e.target.value))} style={{ width: 360, height: 50 }} /> */}
      <div className="d between gap">
        <button className="light-primary" style={{ width: 100 }} onClick={onClose}>
          Cancel
        </button>
        <button className="primary" style={{ width: 100 }} onClick={submit}>
          Upload
        </button>
      </div>
    </StyledModal>
  )
}

const StyledModal = styled.div<{ width?: string, height?: string }>`
	background-color: #404775b3;
	display: flex;
	gap: 1em;
	position: fixed;
	width: 100vw;
	height: 100vh;
	z-index: 10001;
	top: 0;
	left: 0;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	align-content: center;
	-webkit-animation: fadein 0.3s; /* Safari, Chrome and Opera > 12.1 */
	   -moz-animation: fadein 0.3s; /* Firefox < 16 */
		-ms-animation: fadein 0.3s; /* Internet Explorer */
		 -o-animation: fadein 0.3s; /* Opera < 12.1 */
			animation: fadein 0.3s;
    .box {
      width: ${({ width }) => (width ? width + "px" : '360px')};
      height:${({ height }) => (height ? height + "px" : '360px')};
    }
		button {
			padding: 12px 16px;
			color: white;
			background: #1380ab;
			cursor: pointer;
			border-radius: 8px;
			font-size: 1em;
			&:hover {
				opacity: 0.9;
			}
		}
		.light-primary {
			background: #ab4c13;
		}
`

export default AvatarEditor