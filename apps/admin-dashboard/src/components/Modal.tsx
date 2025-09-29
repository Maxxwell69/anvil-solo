import React from 'react'
import styled from 'styled-components'

interface ModalInterface {
  show: boolean
  onClose?: Function
  closeOverlay?: boolean
  children?: any
  style?: any
  sm?: boolean
  md?: boolean
  isDefault?: boolean
}

export default function Modal({ show, onClose, closeOverlay = true, children, style, sm, md, isDefault = false }: ModalInterface) {
  // @ts-ignore
  return <>
    {
      show &&
      <StyledModal>
        <div className="overlay" onClick={() => { closeOverlay && onClose && onClose() }}></div>
        <div className={`modal-container ${!!sm ? 'sm' : ''} ${!!md ? 'md' : ''} ${isDefault ? 'default' : ''}`} style={style}>
          {
            children
          }
        </div>
      </StyledModal>
    }
  </>
}

const StyledModal = styled.div`
	display: flex;
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
	-webkit-animation: fadein 0.2s; /* Safari, Chrome and Opera > 12.1 */
       -moz-animation: fadein 0.2s; /* Firefox < 16 */
        -ms-animation: fadein 0.2s; /* Internet Explorer */
         -o-animation: fadein 0.2s; /* Opera < 12.1 */
            animation: fadein 0.2s;
	@keyframes fadein {
		from { opacity: 0.4; }
		to   { opacity: 1; }
	}
	.overlay{
		position: fixed;
		background-color: rgba(0, 0, 0, 0.45);
		width: 100%;
		height: 100%;
		left: 0;
		top: 0;
		opacity: ${({ theme }) => theme.modalOpacity};
	}
	.modal-container{
		border-radius: 1rem;
		background-color: ${({ theme }) => theme.modalBg};
		color: ${({ theme }) => theme.text};
		padding: 1rem 2rem 2rem;
		position: absolute;
		max-width: 800px;
		min-width: 300px;
		margin-left: auto;
		width: 50%;
		z-index: 10002;
		max-height: 90vh;
		&.sm {
			width: 400px;
			@media (max-width: 576px) {
				width: 100%;
			}
		}
		&.md {
			width: 570px;
			@media (max-width: 576px) {
				width: 100%;
			}
		}
		&.default {
			> div {
				min-height: 0px;
			}
			padding-bottom: 2em;
		}

		@media (max-width: 768px) {
			margin: 0 auto;
			width: 95%;
			max-width: 100vw;
			position: fixed;
			max-height: 80vh;
			padding: 0.5rem 8px 1rem;
		}
		-webkit-animation: container-animation 0.3s; /* Safari, Chrome and Opera > 12.1 */
       -moz-animation: container-animation 0.3s; /* Firefox < 16 */
        -ms-animation: container-animation 0.3s; /* Internet Explorer */
         -o-animation: container-animation 0.3s; /* Opera < 12.1 */
            animation: container-animation 0.3s;
		@keyframes container-animation {
			from { 
				transform: translateY(-100%);
				opacity: 0;
			}
			to   { 
				opacity: 1;
				transform: translateY(0);
			}
		}
	}
`